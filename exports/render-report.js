//
// Write a candidate's findings and assessments as the Markdown report, the
// reports a run wrote as the Markdown summary that links to them, and the
// summary and every report as one Markdown document.
//
//   const { renderReportAsMarkdown, renderSummaryAsMarkdown, renderAllAsMarkdown } = require('./render-report.js')

// @ts-check

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Version} Version */
/** @typedef {import('./types.js').Candidate} Candidate */
/** @typedef {import('./types.js').Assessment} Assessment */
/** @typedef {import('./types.js').Finding} Finding */
/** @typedef {import('./types.js').Diagnostic} Diagnostic */

/**
 * @typedef {string | {code: string, anchor?: string} | {pointer: string} | {atom: string} | {id: string, anchor?: string}} Cell
 *   prose in the report's own Markdown, a value set as code, a JSON Pointer that may break only after a slash, an
 *   atom -- a label the reader must not meet broken across two lines -- or an identifier: a tier or a version, set
 *   as code and kept on one line. A value or an identifier may carry the anchor of the place later in the report
 *   that gives its detail, which the HTML rendering links it to.
 */
/**
 * @typedef {object} Row
 * @property {Cell[]}  cells
 * @property {boolean} [emphasized]  set where the row states something not claimed
 */
/**
 * @typedef {object} Band  a row naming the group the rows below it belong to
 * @property {string}  label         the identifier of the group: a tier
 * @property {string}  [status]     what the group came to, where the group is one that comes to something
 * @property {string}  [anchor]     what a link elsewhere in the report names to reach the band
 * @property {boolean} [emphasized]
 */
/**
 * @typedef {object} Diagnosis  one error an unmet expectation found
 * @property {Cell}   found    the value found there, if any
 * @property {Cell}   where    the site in the candidate
 * @property {string} why      why the expectation is not met
 * @property {string} problem  what the check demanded of this value, in the checking keyword's own terms
 */
/**
 * @typedef {object} Dialect  how one rendering of the report sets its tables
 * @property {(headings: string[], rows: (Row|Band)[]) => string[]} table
 * @property {(diagnoses: Diagnosis[]) => string[]} diagnostics  an unmet expectation's errors
 */
/**
 * @typedef {object} WrittenReport  one report a run wrote
 * @property {Candidate}    candidate    the candidate, with the target it was checked against
 * @property {string}       fileName     the report's, within the reports directory
 * @property {Finding[]}    findings     what the report says of each expectation
 * @property {Assessment[]} assessments  what the report says of each tier at or below the target
 */
/**
 * @typedef {object} Placement  where a report sits: in a file of its own, or as a section of one holding them all
 * @property {string} anchorPrefix  put before every anchor the report makes and links to, so that no two reports in
 *   one document share an anchor; empty for a report in a file of its own
 * @property {number} headingDepth  how many levels below the document's own its headings sit
 */

/** @type {Placement} */
const ON_ITS_OWN = { anchorPrefix: '', headingDepth: 0 }

module.exports = {
    renderReportAsMarkdown,
    renderSummaryAsMarkdown,
    renderAllAsMarkdown,
    htmlTableLines,
    tierLabel,
}

/**
 * @param {Tier} tier
 * @returns {string}  the tier as it is written wherever a reader meets one: its number and its ID
 */
function tierLabel(tier) {
    return `Tier ${tier.number} - ${tier.id}`
}

/**
 * @param {Tier}      tier
 * @param {Placement} placement
 * @returns {string}  the anchor of the band that introduces the tier's expectations in a report
 */
function tierAnchor(tier, placement) {
    return `${placement.anchorPrefix}tier-${tier.number}-${tier.id.toLowerCase()}`
}

/**
 * @param {string}    expectationName
 * @param {Placement} placement
 * @returns {string}  the anchor of the section giving an unmet expectation's diagnostics
 */
function diagnosticsAnchor(expectationName, placement) {
    return `${placement.anchorPrefix}unmet-expectation-${expectationName}`
}

/**
 * @param {number}    level      the heading's level in a report in a file of its own
 * @param {string}    text
 * @param {Placement} placement
 * @returns {string}  the heading, at its level where the report sits
 */
function heading(level, text, placement) {
    return `${'#'.repeat(level + placement.headingDepth)} ${text}`
}

const SOURCE_LABELS = {
    default: 'the default',
    manifest: 'the candidate manifest',
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
 * Names what a diagnostic is about, from the site it was found at: the member the site ends at, qualified by its
 * parent where the last segment -- an index, or a keyword such as `@id` -- names nothing on its own.
 * @param {(string|number)[]} [site]
 * @returns {string}  in the report's own Markdown
 */
function subjectOf(site) {
    if (site === undefined || site.length === 0) return 'the document'

    const last = site[site.length - 1]
    const parent = site[site.length - 2]
    if (typeof last === 'number') return parent === undefined ? `item ${last}` : `\`${parent}\` ${last}`
    if (!last.startsWith('@')) return `\`${last}\``
    if (parent === undefined) return `the \`${last}\``
    return typeof parent === 'number'
        ? `the \`${last}\` of \`${site[site.length - 3]}\` ${parent}`
        : `the \`${last}\` of \`${parent}\``
}

/**
 * Names what failed a check against a list of allowed values: the value found, or, where nothing was found, the
 * name the site ends in, which is a property name that failed.
 * @param {Diagnostic} diagnostic
 * @returns {string}  in the report's own Markdown
 */
function offenderOf({ found, site }) {
    if (found !== undefined) return codeSpan(typeof found === 'string' ? found : JSON.stringify(found))
    const last = site?.[site.length - 1]
    return last === undefined ? 'the document' : codeSpan(String(last))
}

/**
 * @param {Diagnostic} diagnostic
 * @returns {string}  what the keyword demanded of the thing it was checking, in the keyword's own terms
 */
function stateConstraint(diagnostic) {
    const { keyword, constraint = {}, particulars = {}, site } = diagnostic
    const subject = subjectOf(site)
    switch (keyword) {
        case 'required': return `${subject} is missing the required member \`${particulars.missingProperty}\``
        case 'additionalProperties':
        case 'unevaluatedProperties':
            return `${subject} has a member \`${particulars.additionalProperty ?? particulars.unevaluatedProperty}\`,`
                + ' which is not allowed here'
        case 'type': return `${subject} was expected to be of type ${[].concat(constraint.type).join(' or ')}`
        case 'enum': {
            const count = constraint.allowedValues.length
            return count === 1
                ? `${offenderOf(diagnostic)} is not the allowed value`
                : `${offenderOf(diagnostic)} is not one of the ${count} allowed values`
        }
        case 'const': return `${subject} was expected to be ${JSON.stringify(constraint.allowedValue)}`
        case 'pattern': return `${subject} was expected to match pattern \`${constraint.pattern}\``
        case 'maximum': case 'minimum': case 'exclusiveMaximum': case 'exclusiveMinimum':
            return `${subject} was expected to be ${constraint.comparison} ${constraint.limit}`
        case undefined: return `nothing is allowed where ${subject} is`
        default: {
            const stated = { ...constraint, ...particulars }
            return Object.keys(stated).length > 0 ? `${subject}: ${keyword} ${JSON.stringify(stated)}` : `${subject}: ${keyword}`
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
            /** @type {string} */ let text
            if (typeof cell === 'string') text = cellText(cell)
            else if ('code' in cell) text = cellText(codeSpan(cell.code))
            else if ('pointer' in cell) text = cellText(codeSpan(cell.pointer))
            else if ('id' in cell) text = cellText(codeSpan(cell.id))
            else text = cellText(cell.atom)
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
                const label = codeSpan(row.label)
                const named = cellText(row.status ? `${label}  ${row.status}` : label)
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
        return linkedHtml(isOneToken(cell) ? `<samp>${code}</samp>` : `<code>${code}</code>`, cell.anchor)
    }
    if ('pointer' in cell) return `<samp>${escapeHtml(writable(cell.pointer)).replace(/\//g, '/<wbr>')}</samp>`
    if ('id' in cell) return linkedHtml(identifierHtml(cell.id), cell.anchor)
    return unbroken(escapeHtml(writable(cell.atom)))
}

/**
 * @param {string} html
 * @param {string} [anchor]  the anchor of the place in the report that gives the detail, where there is one
 * @returns {string}  the HTML, as a link to that place where an anchor is given
 */
function linkedHtml(html, anchor) {
    return anchor === undefined ? html : `<a href="#${escapeHtml(anchor)}">${html}</a>`
}

/**
 * Sets an identifier as HTML: as code, and kept on one line.
 * @param {string} id
 * @returns {string}
 */
function identifierHtml(id) {
    return `<samp>${unbroken(escapeHtml(writable(id)))}</samp>`
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
                const status = row.status ? unbroken(escapeHtml(writable(`  ${row.status}`))) : ''
                const named = `${identifierHtml(row.label)}${status}`
                const band = row.emphasized ? `<em>${named}</em>` : named
                const target = row.anchor === undefined ? '' : `<a id="${escapeHtml(row.anchor)}"></a>`
                lines.push(`<tr${receded}><th colspan="${headings.length}" align="left"><br>${target}${band}</th></tr>`)
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
        if (diagnoses.length === 0) return ['No location was reported.']
        const lead = diagnoses.length === 1
            ? 'Expectation unmet in 1 place:'
            : `Expectation unmet in ${diagnoses.length} places:`
        const lines = [lead, '', '<table>']
        /** A label cell and its value, as one row. @param {string} label @param {Cell} cell */
        const labeled = (label, cell) => `<tr><th align="left">${label}</th>${setCell(cell)}</tr>`
        diagnoses.forEach((diagnosis, index) => {
            if (index > 0) lines.push('<tbody><tr><td colspan="2">&nbsp;</td></tr></tbody>')
            lines.push('<tbody>', labeled('Rule', diagnosis.why))
            if (diagnosis.problem !== diagnosis.why) lines.push(labeled('Problem', diagnosis.problem))
            if (diagnosis.found !== '') lines.push(labeled('Found', diagnosis.found))
            lines.push(labeled('Where', diagnosis.where), '</tbody>')
        })
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
 * @param {string|undefined} source  where something about the candidate came from
 * @param {string}           option  the command-line option that gives it
 * @returns {string}  what declared it, in the report's own Markdown
 * @throws {Error} if the source has no label.
 */
function declaredBy(source, option) {
    if (source === 'option') return `the \`${option}\` option`

    const label = SOURCE_LABELS[/** @type {keyof SOURCE_LABELS} */ (source)]
    if (label === undefined) throw new Error(`no such source: ${source}`)
    return label
}

/**
 * @param {Candidate} candidate
 * @param {Dialect}   dialect
 * @param {Placement} placement
 * @returns {string[]}  the Candidate Information section's lines
 * @throws {Error} if the description, the target version or the target tier came from a source that has no label.
 */
function candidateLines(candidate, dialect, placement) {
    const { targetTier, targetVersion } = candidate

    /** @type {Row[]} */
    const rows = [{ cells: [{ atom: 'Candidate' }, { code: candidate.fileName }, ''] }]
    if (candidate.description) {
        rows.push({ cells: [
            { atom: 'Description' }, candidate.description, declaredBy(candidate.descriptionSource, '--description')] })
    }
    rows.push({ cells: [
        { atom: 'Target version' }, { id: targetVersion.id }, declaredBy(candidate.targetVersionSource, '--target-version')] })
    rows.push({ cells: [
        { atom: 'Target tier' }, { id: tierLabel(targetTier) }, declaredBy(candidate.targetTierSource, '--target-tier')] })

    return [heading(2, 'Candidate Information', placement), '', ...dialect.table(['', '', 'Declared by'], rows)]
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
 * @param {Placement}    placement
 * @returns {string[]}  the Tier Assessments table's lines
 */
function tierTableLines(tiers, assessments, dialect, placement) {
    /** @type {Row[]} */
    const rows = tiers.map((tier) => {
        const status = tierStatus(tier, assessments)
        return {
            cells: [{ id: tierLabel(tier), anchor: tierAnchor(tier, placement) }, tier.description, { atom: status.label }],
            emphasized: status.emphasized,
        }
    })

    return dialect.table(['Tier', 'Description', 'Status'], rows)
}

/**
 * Every tier's expectations in one table, each tier introduced by a band carrying its name and status.
 * @param {Tier[]}       tiers
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {Dialect}      dialect
 * @param {Placement}    placement
 * @returns {string[]}  the Expectation Findings by Tier section's lines
 */
function tierFindingsLines(tiers, findings, assessments, dialect, placement) {
    /** @type {(Row|Band)[]} */
    const rows = []
    for (const tier of tiers) {
        const status = tierStatus(tier, assessments)
        rows.push({
            label: tierLabel(tier), status: status.label, anchor: tierAnchor(tier, placement),
            emphasized: status.emphasized })
        for (const finding of findings.filter((each) => each.expectation.tier.number === tier.number)) {
            const { expectation } = finding
            const anchor = finding.outcome === 'unmet' ? diagnosticsAnchor(expectation.name, placement) : undefined
            rows.push({
                cells: [{ code: expectation.name, anchor }, expectation.summary, { atom: statusLabel(finding.outcome) }],
                emphasized: finding.outcome === 'not claimed',
            })
        }
    }

    return dialect.table(['Expectation', 'Summary', 'Status'], rows)
}

/**
 * An unmet expectation's details: what it checks, then one row per error -- what was found, where, and why. Where
 * linked, the heading is preceded by an anchor of its own: a heading's anchor is the renderer's to give, and not every
 * renderer gives one.
 * @param {Finding}   finding
 * @param {Dialect}   dialect
 * @param {Placement} placement
 * @param {boolean}   linked
 * @returns {string[]}
 */
function unmetExpectationLines(finding, dialect, placement, linked) {
    /** @type {Diagnosis[]} */
    const diagnoses = finding.errors.map((error) => ({
        found: 'found' in error ? { code: JSON.stringify(error.found) } : '',
        where: error.site && error.site.length > 0 ? { pointer: pointerOf(error.site) } : 'the document',
        why: error.message ?? stateConstraint(error),
        problem: stateConstraint(error),
    }))

    const anchor = linked ? [`<a id="${diagnosticsAnchor(finding.expectation.name, placement)}"></a>`, ''] : []
    return [
        ...anchor,
        heading(3, `Unmet expectation: ${finding.expectation.name}`, placement),
        '',
        `Detailed expectation: ${writable(finding.expectation.description)}`,
        '',
        `Defined in version: ${codeSpan(finding.expectation.version.id)}`,
        '',
        ...dialect.diagnostics(diagnoses),
    ]
}

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

/**
 * @param {number} count
 * @returns {string}  the count in words up to twelve, and in figures above
 */
function inWords(count) {
    return NUMBER_WORDS[count] ?? String(count)
}

/**
 * @param {string[]} items
 * @returns {string}  the items as a sentence lists them: "a", "a and b", "a, b and c"
 */
function listed(items) {
    if (items.length <= 1) return items.join('')
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * @param {Tier}      tier
 * @param {Placement} [linkedIn]  where the report sits, to link the tier to the band that introduces its
 *   expectations; absent for no link
 * @returns {string}  the tier as a sentence names it, in the report's own Markdown
 */
function tierInProse(tier, linkedIn) {
    const label = codeSpan(tierLabel(tier))
    return linkedIn ? `[${label}](#${tierAnchor(tier, linkedIn)})` : label
}

/**
 * Says what a candidate is expected to satisfy: each version in order, with its tiers from the lowest up.
 * @param {{tier: Tier, version: Version}[]} targets
 * @param {Placement} [linkedIn]  where the report sits, to link each tier to the band that introduces its
 *   expectations; absent for no links
 * @returns {string}  one sentence, in the report's own Markdown
 */
function expectationSentence(targets, linkedIn) {
    /** @type {Version[]} */ const versions = []
    for (const { version } of targets) {
        if (!versions.some((each) => each.number === version.number)) versions.push(version)
    }
    versions.sort((one, other) => one.number - other.number)

    const clauses = versions.map((version) => {
        const tiers = targets
            .filter((target) => target.version.number === version.number)
            .map((target) => target.tier)
            .sort((one, other) => one.number - other.number)
        return `${listed(tiers.map((tier) => tierInProse(tier, linkedIn)))} at version ${codeSpan(version.id)}`
    })

    return `This candidate is expected to satisfy ${clauses.join(', and ')}.`
}

/**
 * Says how the candidate came out against its target: that it meets every expectation, or how many it does not
 * meet and in which tiers, and how many were not assessed.
 * @param {Candidate} candidate
 * @param {Finding[]} findings
 * @param {Placement} [linkedIn]  where the report sits, to link each tier to the band that introduces its
 *   expectations; absent for no links
 * @returns {string[]}  one sentence or two, in the report's own Markdown
 */
function resultSentences(candidate, findings, linkedIn) {
    const unmet = findings.filter((finding) => finding.outcome === 'unmet')
    const notAssessed = findings.filter((finding) => finding.outcome === 'not assessed')

    if (unmet.length === 0 && notAssessed.length === 0) {
        const tiersBelow = candidate.targetTier.number - 1
        if (tiersBelow === 0) return ['The candidate meets every expectation in that tier.']
        if (tiersBelow === 1) return ['The candidate meets every expectation in that tier and in the tier below it.']
        return [`The candidate meets every expectation in that tier and in the ${inWords(tiersBelow)} tiers below it.`]
    }

    /** @type {string[]} */ const sentences = []

    const unmetTiers = tiersOf(unmet)
    if (unmetTiers.length === 1) {
        sentences.push(
            `The candidate does not meet ${inWords(unmet.length)} of the expectations in ${tierInProse(unmetTiers[0], linkedIn)}.`)
    } else if (unmetTiers.length > 1) {
        const counts = unmetTiers.map((tier) => {
            const count = unmet.filter((finding) => finding.expectation.tier.number === tier.number).length
            return `${inWords(count)} in ${tierInProse(tier, linkedIn)}`
        })
        sentences.push(`The candidate does not meet ${inWords(unmet.length)} of the expectations: ${listed(counts)}.`)
    }

    if (notAssessed.length === 1) {
        sentences.push(
            'One other expectation was not assessed, because a tier below it, or an expectation it requires, was not met.')
    } else if (notAssessed.length > 1) {
        sentences.push(
            `A further ${inWords(notAssessed.length)} expectations were not assessed, `
            + 'because a tier below them, or an expectation they require, was not met.')
    }

    return sentences
}

/**
 * The report's opening: what the document is, what the candidate is, what it is expected to satisfy and how it
 * came out, and what the sections below contain.
 * @param {Candidate} candidate
 * @param {Finding[]} findings
 * @param {Placement} placement
 * @param {boolean}   linked  whether to link each tier it names to the band that introduces its expectations
 * @returns {string[]}
 */
function openingLines(candidate, findings, placement, linked) {
    const linkedIn = linked ? placement : undefined
    const lines = [
        heading(1, `Report on ${codeSpan(candidate.fileName)}`, placement),
        '',
        'This report was written by `tro-checks`, which checks a TRO declaration against the requirements of the '
        + 'TRACE Specification.',
    ]

    if (candidate.description) lines.push('', writable(candidate.description))

    const expectation = expectationSentence([{ tier: candidate.targetTier, version: candidate.targetVersion }], linkedIn)
    lines.push('', [expectation, ...resultSentences(candidate, findings, linkedIn)].join(' '))

    const someUnmet = findings.some((finding) => finding.outcome === 'unmet')
    lines.push('', someUnmet
        ? 'The sections below give the status of each tier, then the status of each expectation, then, for each '
            + 'expectation not met, what was found, where in the candidate, and why it does not meet the expectation.'
        : 'The sections below give the status of each tier, then the status of each expectation.')

    return lines
}

/**
 * @param {Candidate}    candidate
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {boolean}      [compactly]  without blank lines, tables in Markdown (for terminal output, yields invalid Markdown)
 * @param {Placement}    [placement]  where the report sits; by default, in a file of its own
 * @returns {string}
 */
function renderReportAsMarkdown(candidate, findings, assessments, compactly, placement = ON_ITS_OWN) {
    const dialect = compactly ? pipeDialect : htmlDialect
    const tiers = tiersOf(findings)
    const reportLines = [
        ...openingLines(candidate, findings, placement, !compactly),
        '',
        ...candidateLines(candidate, dialect, placement),
        '',
        heading(2, 'Tier Assessments', placement),
        '',
        ...tierTableLines(tiers, assessments, dialect, placement),
        '',
        heading(2, 'Expectation Findings by Tier', placement),
        '',
        ...tierFindingsLines(tiers, findings, assessments, dialect, placement),
    ]

    const unmetFindings = findings.filter((finding) => finding.outcome === 'unmet')
    if (unmetFindings.length > 0) {
        reportLines.push('', heading(2, 'Diagnostics for Each Unmet Expectation', placement))
        for (const finding of unmetFindings) {
            reportLines.push('', ...unmetExpectationLines(finding, dialect, placement, !compactly))
        }
    }

    if (compactly) return `${reportLines.filter((line) => line !== '').join('\n')}\n`

    return `${reportLines.join('\n')}\n`
}

/**
 * One candidate's reports as a row each: the target, whether the target tier was met, and a link to the report.
 * @param {WrittenReport[]} candidateReports  the reports on one candidate
 * @param {boolean}         inOneDocument     whether the reports follow in the same document, so that each link goes
 *   to its section there rather than to its file
 * @returns {Row[]}  by target version, and by target tier within a version
 * @throws {Error} if a report carries no assessment of its target tier.
 */
function summaryRows(candidateReports, inOneDocument) {
    const inTargetOrder = [...candidateReports].sort((one, other) =>
        one.candidate.targetVersion.number - other.candidate.targetVersion.number
        || one.candidate.targetTier.number - other.candidate.targetTier.number)

    return inTargetOrder.map(({ candidate, fileName, assessments }) => {
        const { targetTier, targetVersion } = candidate
        const assessment = assessments.find((each) => each.tier.number === targetTier.number)
        if (assessment === undefined) throw new Error(`${fileName} carries no assessment of ${targetTier.id}`)

        return { cells: [
            { id: targetVersion.id },
            { id: tierLabel(targetTier) },
            { atom: statusLabel(assessment.outcome) },
            `[${fileName}](${inOneDocument ? `#${reportAnchor(fileName)}` : encodeURI(fileName)})`,
        ] }
    })
}

/**
 * The summary of the reports a run wrote: under each candidate, what it is and a table of its reports. A candidate
 * is headed by its title, with its file named beneath, or by its name where it has no title.
 * @param {WrittenReport[]} writtenReports  in the order the candidates and their targets were checked
 * @param {boolean}         [inOneDocument]  whether the reports follow in the same document
 * @returns {string}
 * @throws {Error} if a report carries no assessment of its target tier.
 */
function renderSummaryAsMarkdown(writtenReports, inOneDocument = false) {
    const summaryLines = ['# Reports', '', 'One report for each target of each candidate.']

    const fileNames = [...new Set(writtenReports.map((report) => report.candidate.fileName))]
    for (const candidateFileName of fileNames) {
        const candidateReports = writtenReports.filter((report) => report.candidate.fileName === candidateFileName)
        const { name, title, description } = candidateReports[0].candidate

        if (title) {
            summaryLines.push('', `## ${writable(title)}`, '', `Candidate: ${codeSpan(candidateFileName)}`)
        } else {
            summaryLines.push('', `## ${codeSpan(name ?? candidateFileName)}`)
        }
        if (description) summaryLines.push('', writable(description))
        summaryLines.push('', expectationSentence(candidateReports.map((report) => (
            { tier: report.candidate.targetTier, version: report.candidate.targetVersion }))))
        summaryLines.push(
            '', ...htmlDialect.table(['Target version', 'Target tier', 'Status', 'Report'], summaryRows(candidateReports, inOneDocument)))
    }

    return `${summaryLines.join('\n')}\n`
}

/**
 * @param {string} fileName  a report's
 * @returns {string}  the anchor of the report's section in the document holding every report, and the prefix of
 *   every anchor within it
 */
function reportAnchor(fileName) {
    return fileName.replace(/\.md$/, '')
}

/**
 * Every report a run wrote, in one document: the summary, its links going to the reports' sections below, then each
 * report a heading level down, with its anchors made its own. For a reader with no files to follow, such as the page
 * of a GitHub Actions run.
 * @param {WrittenReport[]} writtenReports  in the order the candidates and their targets were checked
 * @returns {string}
 * @throws {Error} if a report carries no assessment of its target tier.
 */
function renderAllAsMarkdown(writtenReports) {
    const lines = [renderSummaryAsMarkdown(writtenReports, true).trimEnd()]
    for (const { candidate, fileName, findings, assessments } of writtenReports) {
        const anchor = reportAnchor(fileName)
        const placement = { anchorPrefix: `${anchor}--`, headingDepth: 1 }
        lines.push('', '---', '', `<a id="${anchor}"></a>`, '',
            renderReportAsMarkdown(candidate, findings, assessments, false, placement).trimEnd())
    }
    return `${lines.join('\n')}\n`
}
