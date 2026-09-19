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
 * @typedef {string | {code: string} | {pointer: string} | {atom: string}} Cell  prose in the report's own Markdown,
 *   a value set as code, a JSON Pointer that may break only after a slash, or an atom -- a label or identifier the
 *   reader must not meet broken across two lines
 */
/**
 * @typedef {object} Row
 * @property {Cell[]}  cells
 * @property {boolean} [emphasized]  set where the row states something not claimed
 */
/**
 * @typedef {object} Band  a row naming the group the rows below it belong to
 * @property {string}  label
 * @property {string}  [status]     what the group came to, where the group is one that comes to something
 * @property {boolean} [emphasized]
 */
/**
 * @typedef {object} Diagnosis  one error an unmet expectation found
 * @property {Cell}   found  the value found there, if any
 * @property {Cell}   where  the site in the candidate
 * @property {string} why    why the expectation is not met
 */
/**
 * @typedef {object} Dialect  how one rendering of the report sets its tables
 * @property {(headings: string[], rows: (Row|Band)[]) => string[]} table
 * @property {(diagnoses: Diagnosis[]) => string[]} diagnostics  an unmet expectation's errors
 */

module.exports = {
    renderReportAsMarkdown,
    htmlTableLines,
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

const HIGH_SURROGATE_FIRST = 0xD800
const HIGH_SURROGATE_LAST = 0xDBFF
const LOW_SURROGATE_FIRST = 0xDC00
const LOW_SURROGATE_LAST = 0xDFFF

/** @param {number} code */
const isHighSurrogate = (code) => code >= HIGH_SURROGATE_FIRST && code <= HIGH_SURROGATE_LAST

/** @param {number} code */
const isLowSurrogate = (code) => code >= LOW_SURROGATE_FIRST && code <= LOW_SURROGATE_LAST

/**
 * Text as the report can write it: newlines collapsed and every unpaired surrogate written as its escape.
 * @param {string} text
 * @returns {string}
 */
function writable(text) {
    const collapsed = text.replace(/\r?\n/g, ' ')
    let written = ''
    for (let i = 0; i < collapsed.length; i++) {
        const code = collapsed.charCodeAt(i)
        const paired = (isHighSurrogate(code) && isLowSurrogate(collapsed.charCodeAt(i + 1)))
            || (isLowSurrogate(code) && isHighSurrogate(collapsed.charCodeAt(i - 1)))
        const lone = (isHighSurrogate(code) || isLowSurrogate(code)) && !paired
        written += lone ? `\\u${code.toString(16).padStart(4, '0')}` : collapsed[i]
    }
    return written
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
    return writable(text).replace(/\|/g, '\\|')
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
                : 'code' in cell ? cellText(codeSpan(cell.code))
                    : 'pointer' in cell ? cellText(codeSpan(cell.pointer)) : cellText(cell.atom)
            return emphasized && text ? `*${text}*` : text
        }

        const headingRow = `| ${headings.join(' | ')} |`
        const banded = rows.some(isBand)
        const lines = [
            banded ? `| ${headings.map(() => '').join(' | ')} |` : headingRow,
            `| ${headings.map(() => '---').join(' | ')} |`,
        ]
        for (const row of rows) {
            if (isBand(row)) {
                const named = cellText(row.status ? `${row.label}  ${row.status}` : row.label)
                const band = row.emphasized ? `*${named}*` : `**${named}**`
                const padding = new Array(Math.max(0, headings.length - 1)).fill('')
                lines.push(`| ${[band, ...padding].join(' | ')} |`, headingRow)
            } else {
                lines.push(`| ${row.cells.map((cell) => setCell(cell, row.emphasized)).join(' | ')} |`)
            }
        }
        return lines
    },
    diagnostics(diagnoses) {
        return pipeDialect.table(['Found', 'Where', 'Expectation not met because'],
            diagnoses.map((diagnosis) => ({ cells: [diagnosis.found, diagnosis.where, diagnosis.why] })))
    },
}

//
// The HTML dialect: one table per section, each band a row spanning every column, so the
// reader's browser wraps the prose and the columns align throughout.
//

/**
 * @param {string} text
 * @returns {string}  with the characters that would open markup written as entities
 */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Sets an atom as HTML, each space and hyphen written as the character that does not break.
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
    return writable(text)
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

/** Sets a row back from the ones it sits among, for what the candidate does not claim. */
const RECEDED = ' style="color: var(--vscode-descriptionForeground, #767676)"'

/**
 * @param {Cell} cell
 * @returns {boolean}  whether the cell is a value with no space in it, which is kept on one line
 */
function isOneToken(cell) {
    return typeof cell !== 'string' && 'code' in cell && !/\s/.test(cell.code)
}

/**
 * Sets a cell's content as HTML.
 * @param {Cell} cell
 * @returns {string}
 */
function cellHtml(cell) {
    if (typeof cell === 'string') return inlineHtml(cell)
    if ('code' in cell) {
        const code = escapeHtml(writable(cell.code))
        return isOneToken(cell) ? `<samp>${code}</samp>` : `<code>${code}</code>`
    }
    if ('pointer' in cell) return `<samp>${escapeHtml(writable(cell.pointer)).replace(/\//g, '/<wbr>')}</samp>`
    return unbroken(escapeHtml(writable(cell.atom)))
}

/**
 * Sets a cell as an HTML table cell.
 * @param {Cell} cell
 * @param {boolean} [emphasized]
 * @returns {string}
 */
function setCell(cell, emphasized) {
    const html = cellHtml(cell)
    const attributes = isOneToken(cell) ? ' nowrap' : ''
    return `<td${attributes}>${emphasized && html ? `<em>${html}</em>` : html}</td>`
}

/** @type {Dialect} */
const htmlDialect = {
    table(headings, rows) {

        const titled = headings.some((heading) => heading !== '')
        const headingCells = headings.map((heading) => `<th align="left">${inlineHtml(heading)}</th>`).join('')
        /** @param {string} [receded] */
        const headingRow = (receded = '') => `<tr${receded}>${headingCells}</tr>`

        const lines = ['<table>']
        const banded = rows.some(isBand)
        if (titled && !banded) lines.push('<thead>', headingRow(), '</thead>')

        let within = false
        const open = () => {
            if (!within) lines.push('<tbody>')
            within = true
        }
        for (const row of rows) {
            const receded = row.emphasized ? RECEDED : ''
            if (isBand(row)) {
                if (within) lines.push('</tbody>')
                within = false
                open()
                const titleText = row.status ? `${row.label}  ${row.status}` : row.label
                const named = unbroken(escapeHtml(writable(titleText)))
                const band = row.emphasized ? `<em>${named}</em>` : named
                lines.push(`<tr${receded}><th colspan="${headings.length}" align="left"><br>${band}</th></tr>`)
                if (titled) lines.push(headingRow(receded))
            } else {
                open()
                lines.push(`<tr${receded}>${row.cells.map((cell) => setCell(cell, row.emphasized)).join('')}</tr>`)
            }
        }
        if (within) lines.push('</tbody>')
        lines.push('</table>')
        return lines
    },
    diagnostics(diagnoses) {
        const lines = ['<table>', '<thead>',
            '<tr><th align="left">Found</th><th align="left">Expectation not met because</th></tr>', '</thead>']
        for (const diagnosis of diagnoses) {
            lines.push('<tbody>',
                `<tr>${setCell(diagnosis.found)}${setCell(diagnosis.why)}</tr>`,
                `<tr><td colspan="2">Where: ${cellHtml(diagnosis.where)}</td></tr>`,
                '</tbody>')
        }
        lines.push('</table>')
        return lines
    },
}

/**
 * The report's HTML tables, for the other documents this repository generates from the same expectations.
 * @param {string[]}     headings
 * @param {(Row|Band)[]} rows
 * @returns {string[]}
 */
function htmlTableLines(headings, rows) {
    return htmlDialect.table(headings, rows)
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
 * Every tier's expectations in one table, each tier introduced by a band carrying its name and status.
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
                cells: [{ code: expectation.name }, expectation.summary, { atom: statusLabel(finding.outcome) }],
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
    /** @type {Diagnosis[]} */
    const diagnoses = finding.errors.map((error) => ({
        found: 'found' in error ? { code: JSON.stringify(error.found) } : '',
        where: error.site && error.site.length > 0 ? { pointer: pointerOf(error.site) } : 'the document',
        why: error.message ?? stateConstraint(error),
    }))

    return [
        `### Unmet expectation: ${finding.expectation.name}`,
        '',
        `Expectation details: ${writable(finding.expectation.description)}`,
        '',
        ...dialect.diagnostics(diagnoses),
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
        reportLines.push('', '## Diagnostics for Each Unmet Expectation')
        for (const finding of unmetFindings) {
            reportLines.push('', ...unmetExpectationLines(finding, dialect))
        }
    }

    if (compactly) return `${reportLines.filter((line) => line !== '').join('\n')}\n`

    return `${reportLines.join('\n')}\n`
}
