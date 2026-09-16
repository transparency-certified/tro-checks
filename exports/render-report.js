//
// Write a candidate's findings and assessments as the Markdown report.
//
//   const { renderReportAsMarkdown } = require('./render-report.js')

// @ts-check

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Candidate} Candidate */
/** @typedef {import('./types.js').Assessment} Assessment */
/** @typedef {import('./types.js').Finding} Finding */
/** @typedef {import('./types.js').Diagnostic} Diagnostic */

/**
 * @typedef {string | {code: string} | {atom: string}} Cell  prose in the report's own Markdown, a value
 *   set as code, or an atom -- a label or identifier the reader must not meet broken across two lines
 */
/**
 * @typedef {object} Row
 * @property {Cell[]}  cells
 * @property {boolean} [emphasized]  set where the row states something not claimed
 */
/**
 * @typedef {object} Band  a row naming the group the rows below it belong to
 * @property {string}  label
 * @property {string}  status       shown in the table's last column, beneath the rows' own statuses
 * @property {boolean} [emphasized]
 */
/**
 * @typedef {object} Dialect  how one rendering of the report sets its tables
 * @property {(headings: string[], rows: (Row|Band)[]) => string[]} table
 */

module.exports = {
    renderReportAsMarkdown,
}

const TARGET_SOURCE_LABELS = {
    default: 'the default',
    manifest: 'the candidate manifest',
    option: 'the `--target` option',
}

const STATUS_LABELS = {
    'met': '✅ met',
    'unmet': '❌ not met',
    'not assessed': 'not assessed',
    'not claimed': 'not claimed',
}

/**
 * @param {(string|number)[]} segments
 * @returns {string}  a JSON Pointer
 */
function pointerOf(segments) {
    return `/${segments.map((s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1')).join('/')}`
}

/**
 * @param {Diagnostic} diagnostic
 * @returns {string}  what the keyword demanded, in its own terms
 */
function stateConstraint({ keyword, constraint = {}, particulars = {} }) {
    switch (keyword) {
        case 'required': return `missing required member \`${particulars.missingProperty}\``
        case 'additionalProperties':
        case 'unevaluatedProperties':
            return `member \`${particulars.additionalProperty ?? particulars.unevaluatedProperty}\` is not allowed here`
        case 'type': return `expected type ${[].concat(constraint.type).join(' or ')}`
        case 'enum': return `expected one of ${JSON.stringify(constraint.allowedValues)}`
        case 'const': return `expected ${JSON.stringify(constraint.allowedValue)}`
        case 'pattern': return `expected to match pattern \`${constraint.pattern}\``
        case 'maximum': case 'minimum': case 'exclusiveMaximum': case 'exclusiveMinimum':
            return `expected a value ${constraint.comparison} ${constraint.limit}`
        case undefined: return 'the schema here admits nothing'
        default: {
            const stated = { ...constraint, ...particulars }
            return Object.keys(stated).length > 0 ? `${keyword} ${JSON.stringify(stated)}` : keyword
        }
    }
}

/**
 * @param {string} outcome
 * @returns {string}  the status as the report shows it
 * @throws {Error} if the outcome has no label.
 */
function statusLabel(outcome) {
    const label = STATUS_LABELS[/** @type {keyof STATUS_LABELS} */ (outcome)]
    if (label === undefined) throw new Error(`no status label for outcome: ${outcome}`)
    return label
}

/**
 * Collapses the newlines an authored sentence may carry, which no cell can hold.
 * @param {string} text
 * @returns {string}
 */
function oneLine(text) {
    return text.replace(/\r?\n/g, ' ')
}

/**
 * @param {(Row|Band)} row
 * @returns {row is Band}
 */
function isBand(row) {
    return 'label' in row
}

//
// The pipe dialect: the Markdown tables the terminal rendering keeps, where a band
// is an ordinary row carrying its label and its status.
//

/**
 * Makes text safe inside a Markdown table cell: a pipe would end the cell.
 * @param {string} text
 * @returns {string}
 */
function cellText(text) {
    return oneLine(text).replace(/\|/g, '\\|')
}

/**
 * Sets text as inline code, fenced with one more backtick than the longest run of backticks it contains.
 * @param {string} text
 * @returns {string}
 */
function codeSpan(text) {
    const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
    const fence = '`'.repeat(longestRun + 1)
    const padding = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
    return `${fence}${padding}${text}${padding}${fence}`
}

/** @type {Dialect} */
const pipeDialect = {
    table(headings, rows) {
        /**
         * @param {Cell} cell
         * @param {boolean} [emphasized]
         * @returns {string}
         */
        const setCell = (cell, emphasized) => {
            const text = typeof cell === 'string'
                ? cellText(cell)
                : 'code' in cell ? cellText(codeSpan(cell.code)) : cellText(cell.atom)
            return emphasized && text ? `*${text}*` : text
        }

        const lines = [
            `| ${headings.join(' | ')} |`,
            `| ${headings.map(() => '---').join(' | ')} |`,
        ]
        for (const row of rows) {
            if (isBand(row)) {
                const label = row.emphasized ? `*${cellText(row.label)}*` : `**${cellText(row.label)}**`
                const status = row.emphasized ? `*${cellText(row.status)}*` : cellText(row.status)
                const padding = new Array(Math.max(0, headings.length - 2)).fill('')
                lines.push(`| ${[label, ...padding, status].join(' | ')} |`)
            } else {
                lines.push(`| ${row.cells.map((cell) => setCell(cell, row.emphasized)).join(' | ')} |`)
            }
        }
        return lines
    },
}

//
// The HTML dialect: one table per section, each band a row spanning every column but
// the last, so the reader's browser wraps the prose and the columns align throughout.
//

/**
 * @param {string} text
 * @returns {string}  with the characters that would open markup written as entities
 */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Sets an atom as HTML: the spaces and hyphens within it are the ones a browser would
 * break at, so each is written as the character that does not break.
 * @param {string} text  already escaped
 * @returns {string}
 */
function unbroken(text) {
    return text.replace(/ /g, '&nbsp;').replace(/-/g, '&#8209;')
}

/**
 * Sets an authored sentence as HTML, honoring the code spans and links its Markdown carries.
 * @param {string} text
 * @returns {string}
 */
function inlineHtml(text) {
    return oneLine(text)
        .split(/(`+[^`]*`+)/)
        .map((part) => {
            if (/^`+[^`]*`+$/.test(part)) {
                return `<code>${escapeHtml(part.replace(/^`+ ?/, '').replace(/ ?`+$/, ''))}</code>`
            }
            return escapeHtml(part).replace(
                /\[([^\]]*)\]\(([^)\s]*)\)/g,
                (_, label, target) => `<a href="${escapeHtml(target)}">${label}</a>`,
            )
        })
        .join('')
}

/** @type {Dialect} */
const htmlDialect = {
    table(headings, rows) {
        /**
         * @param {Cell} cell
         * @param {boolean} [emphasized]
         * @returns {string}
         */
        const setCell = (cell, emphasized) => {
            const html = typeof cell === 'string'
                ? inlineHtml(cell)
                : 'code' in cell
                    ? `<code>${escapeHtml(oneLine(cell.code))}</code>`
                    : unbroken(escapeHtml(oneLine(cell.atom)))
            return `<td>${emphasized && html ? `<em>${html}</em>` : html}</td>`
        }

        const lines = ['<table>']
        if (headings.some((heading) => heading !== '')) {
            lines.push(
                '<thead>',
                `<tr>${headings.map((heading) => `<th align="left">${inlineHtml(heading)}</th>`).join('')}</tr>`,
                '</thead>',
            )
        }
        lines.push('<tbody>')
        for (const row of rows) {
            if (isBand(row)) {
                const label = row.emphasized ? `<em>${inlineHtml(row.label)}</em>` : inlineHtml(row.label)
                const shown = unbroken(escapeHtml(oneLine(row.status)))
                const status = row.emphasized ? `<em>${shown}</em>` : shown
                lines.push(
                    `<tr><th colspan="${headings.length - 1}" align="left">${label}</th>` +
                    `<th align="left">${status}</th></tr>`,
                )
            } else {
                lines.push(`<tr>${row.cells.map((cell) => setCell(cell, row.emphasized)).join('')}</tr>`)
            }
        }
        lines.push('</tbody>', '</table>')
        return lines
    },
}

/**
 * @param {Candidate} candidate
 * @param {Dialect}   dialect
 * @returns {string[]}  the Candidate Information section's lines
 */
function candidateLines(candidate, dialect) {
    const targetSourceLabel = TARGET_SOURCE_LABELS[candidate.targetSource]
    if (targetSourceLabel === undefined) throw new Error(`no such target source: ${candidate.targetSource}`)

    /** @type {Row[]} */
    const rows = [{ cells: [{ atom: 'Candidate' }, { code: candidate.fileName }] }]
    if (candidate.description) rows.push({ cells: [{ atom: 'Description' }, candidate.description] })
    rows.push({ cells: [{ atom: 'Target' }, { atom: `${candidate.targetTier.number} ${candidate.targetTier.id}` }] })
    rows.push({ cells: [{ atom: 'Target declared by' }, targetSourceLabel] })

    return ['## Candidate Information', '', ...dialect.table(['', ''], rows)]
}

/**
 * Every tier an expectation belongs to, including those above the target, which carry no assessment.
 * @param {Finding[]} findings
 * @returns {Tier[]}  in tier order
 */
function tiersOf(findings) {
    /** @type {Tier[]} */ const tiers = []
    for (const finding of findings) {
        if (!tiers.some((tier) => tier.number === finding.expectation.tier.number)) tiers.push(finding.expectation.tier)
    }
    return tiers.sort((one, other) => one.number - other.number)
}

/**
 * @param {Tier}         tier
 * @param {Assessment[]} assessments
 * @returns {{label: string, emphasized: boolean}}  the tier's status, emphasized where the tier is not claimed
 */
function tierStatus(tier, assessments) {
    const assessment = assessments.find((each) => each.tier.number === tier.number)
    return assessment
        ? { label: statusLabel(assessment.outcome), emphasized: false }
        : { label: statusLabel('not claimed'), emphasized: true }
}

/**
 * @param {Tier[]}       tiers
 * @param {Assessment[]} assessments
 * @param {Dialect}      dialect
 * @returns {string[]}  the Tier Assessments table's lines
 */
function tierTableLines(tiers, assessments, dialect) {
    /** @type {Row[]} */
    const rows = tiers.map((tier) => {
        const status = tierStatus(tier, assessments)
        return {
            cells: [String(tier.number), { atom: tier.id }, tier.description, { atom: status.label }],
            emphasized: status.emphasized,
        }
    })

    return dialect.table(['Tier', 'ID', 'Description', 'Status'], rows)
}

/**
 * Every tier's expectations in one table, each tier introduced by a band carrying the
 * tier's name and its assessment status.
 * @param {Tier[]}       tiers
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {Dialect}      dialect
 * @returns {string[]}  the Expectation Findings by Tier section's lines
 */
function tierFindingsLines(tiers, findings, assessments, dialect) {
    /** @type {(Row|Band)[]} */
    const rows = []
    for (const tier of tiers) {
        const status = tierStatus(tier, assessments)
        rows.push({ label: `Tier ${tier.number} — ${tier.id}`, status: status.label, emphasized: status.emphasized })
        for (const finding of findings.filter((each) => each.expectation.tier.number === tier.number)) {
            const { expectation } = finding
            rows.push({
                cells: [expectation.name, expectation.summary, { atom: statusLabel(finding.outcome) }],
                emphasized: finding.outcome === 'not claimed',
            })
        }
    }

    return dialect.table(['Expectation', 'Summary', 'Status'], rows)
}

/**
 * An unmet expectation's details: what it checks, then one row per error -- what was found, where, and why.
 * @param {Finding} finding
 * @param {Dialect} dialect
 * @returns {string[]}
 */
function unmetExpectationLines(finding, dialect) {
    /** @type {Row[]} */
    const rows = finding.errors.map((error) => ({
        cells: [
            'found' in error ? { code: JSON.stringify(error.found) } : '',
            error.site && error.site.length > 0 ? { code: pointerOf(error.site) } : 'the document',
            error.message ?? stateConstraint(error),
        ],
    }))

    return [
        `### Unmet expectation: ${finding.expectation.name}`,
        '',
        `Expectation details: ${oneLine(finding.expectation.description)}`,
        '',
        ...dialect.table(['Found', 'Where', 'Expectation not met because'], rows),
    ]
}

/**
 * @param {Candidate}    candidate
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {boolean}      [compactly]  without blank lines, tables in Markdown (for terminal output, yields invalid Markdown)
 * @returns {string}
 */
function renderReportAsMarkdown(candidate, findings, assessments, compactly) {
    const dialect = compactly ? pipeDialect : htmlDialect
    const tiers = tiersOf(findings)
    const reportLines = [
        '# Report',
        '',
        ...candidateLines(candidate, dialect),
        '',
        '## Tier Assessments',
        '',
        ...tierTableLines(tiers, assessments, dialect),
        '',
        '## Expectation Findings by Tier',
        '',
        ...tierFindingsLines(tiers, findings, assessments, dialect),
    ]

    const unmetFindings = findings.filter((finding) => finding.outcome === 'unmet')
    if (unmetFindings.length > 0) {
        reportLines.push('', '## Details')
        for (const finding of unmetFindings) {
            reportLines.push('', ...unmetExpectationLines(finding, dialect))
        }
    }

    if (compactly) return `${reportLines.filter((line) => line !== '').join('\n')}\n`

    return `${reportLines.join('\n')}\n`
}
