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
 * Makes text safe inside a Markdown table cell: a pipe would end the cell and a newline the row.
 * @param {string} text
 * @returns {string}
 */
function cellText(text) {
    return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
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

/**
 * @param {string[]}   headings
 * @param {string[][]} rows  each row's cells, already made safe
 * @returns {string[]}  the table's lines, cells unpadded
 */
function tableLines(headings, rows) {
    const lines = [
        `| ${headings.join(' | ')} |`,
        `| ${headings.map(() => '---').join(' | ')} |`,
    ]
    for (const cells of rows) {
        lines.push(`| ${cells.join(' | ')} |`)
    }
    return lines
}

/**
 * A row of a tier or expectation not claimed is set entirely in italics, its status carrying no glyph.
 * @param {string[]} cells
 * @returns {string[]}
 */
function italicized(cells) {
    return cells.map((cell) => `*${cell}*`)
}

/**
 * @param {Candidate} candidate
 * @returns {string[]}  the Candidate Information section's lines
 */
function candidateLines(candidate) {
    const targetSourceLabel = TARGET_SOURCE_LABELS[candidate.targetSource]
    if (targetSourceLabel === undefined) throw new Error(`no such target source: ${candidate.targetSource}`)

    const rows = [['Candidate', cellText(codeSpan(candidate.fileName))]]
    if (candidate.description) rows.push(['Description', cellText(candidate.description)])
    rows.push(['Target', `Tier ${candidate.targetTier.number} — ${cellText(candidate.targetTier.name)}`])
    rows.push(['Target declared by', targetSourceLabel])

    return ['## Candidate Information', '', ...tableLines(['', ''], rows)]
}

/**
 * Every tier an expectation belongs to, including those above the target, which carry no assessment.
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @returns {string[]}  the By Representation Tier table's lines
 */
function tierTableLines(findings, assessments) {
    /** @type {Tier[]} */ const tiers = []
    for (const finding of findings) {
        if (!tiers.some((tier) => tier.number === finding.expectation.tier.number)) tiers.push(finding.expectation.tier)
    }
    tiers.sort((one, other) => one.number - other.number)

    const rows = []
    for (const tier of tiers) {
        const assessment = assessments.find((each) => each.tier.number === tier.number)
        const cells = [String(tier.number), cellText(tier.name), cellText(tier.description)]
        if (assessment) {
            rows.push([...cells, statusLabel(assessment.outcome)])
        } else {
            rows.push(italicized([...cells, statusLabel('not claimed')]))
        }
    }

    return tableLines(['Tier', 'Name', 'Description', 'Status'], rows)
}

/**
 * @param {Finding[]} findings
 * @returns {string[]}  the By Individual Expectation table's lines
 */
function expectationTableLines(findings) {
    const rows = []
    for (const finding of findings) {
        const { expectation } = finding
        const cells = [String(expectation.tier.number), cellText(expectation.name), cellText(expectation.summary), statusLabel(finding.outcome)]
        if (finding.outcome === 'not claimed') {
            rows.push(italicized(cells))
        } else {
            rows.push(cells)
        }
    }

    return tableLines(['Tier', 'Expectation', 'Summary', 'Status'], rows)
}

/**
 * An unmet expectation's details: what it checks, then one row per error -- what was found, where, and why.
 * @param {Finding} finding
 * @returns {string[]}
 */
function unmetExpectationLines(finding) {
    const rows = []
    for (const error of finding.errors) {
        const found = 'found' in error ? cellText(codeSpan(JSON.stringify(error.found))) : ''
        const where = error.site && error.site.length > 0 ? cellText(codeSpan(pointerOf(error.site))) : 'the document'
        const because = cellText(error.message ?? stateConstraint(error))
        rows.push([found, where, because])
    }

    return [
        `### Unmet expectation: ${finding.expectation.name}`,
        '',
        `Expectation details: ${finding.expectation.description.replace(/\r?\n/g, ' ')}`,
        '',
        ...tableLines(['Found', 'Where', 'Expectation not met because'], rows),
    ]
}

/**
 * @param {Candidate}    candidate
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {boolean}      [compactly]  without blank lines (for terminal output, yields invalid Markdown)
 * @returns {string}
 */
function renderReportAsMarkdown(candidate, findings, assessments, compactly) {
    const reportLines = [
        '# Report',
        '',
        ...candidateLines(candidate),
        '',
        '## Assessments',
        '',
        '### By Representation Tier',
        '',
        ...tierTableLines(findings, assessments),
        '',
        '### By Individual Expectation',
        '',
        ...expectationTableLines(findings),
    ]

    const unmetFindings = findings.filter((finding) => finding.outcome === 'unmet')
    if (unmetFindings.length > 0) {
        reportLines.push('', '## Details')
        for (const finding of unmetFindings) {
            reportLines.push('', ...unmetExpectationLines(finding))
        }
    }

    if (compactly) return `${reportLines.filter((line) => line !== '').join('\n')}\n`

    return `${reportLines.join('\n')}\n`
}
