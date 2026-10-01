//
// Write the README's account of what is checked from the expectations themselves, so that
// the tiers, the versions, their order and every summary are said once, in the files the
// checker reads; and write docs/version-history.md, which says what each version changed.
//
//   node render-readme.js <repository directory>
//

// @ts-check

const fs = require('fs')
const path = require('path')

const { htmlTableLines, tierLabel } = require('./render-report.js')
const checkTro = require('./check-tro.js')

/** @typedef {import('./render-report.js').Row} Row */
/** @typedef {import('./render-report.js').Band} Band */
/** @typedef {import('./types.js').Version} Version */
/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Expectation} Expectation */
/** @typedef {ReturnType<checkTro.resolveVersion>} Resolution */

const TIER_SUMMARY = 'tier-summary'
const VERSION_SUMMARY = 'version-summary'
const TIER_EXPECTATIONS = 'tier-expectations'
const HISTORY_PATH = path.join('docs', 'version-history.md')

/**
 * @param {string} region  the name the markers carry
 * @returns {{opening: string, closing: string}}  the comments the region sits between
 */
function markersOf(region) {
    return { opening: `<!-- generated: ${region} -->`, closing: `<!-- end: ${region} -->` }
}

/**
 * @param {string}       name
 * @param {Resolution[]} resolutions  every version's, in order
 * @returns {string}  the versions the expectation is listed under and those that redefine it, in the
 *   README's own Markdown: `all` where every version lists it with one implementation
 */
function versionsColumnOf(name, resolutions) {
    /** @type {string[]} */ const notes = []
    /** @type {Expectation|undefined} */ let previous
    resolutions.forEach((resolution, index) => {
        const expectation = resolution.expectations.find((each) => each.name === name)
        if (expectation && !previous && index > 0) notes.push(`from \`${resolution.version.id}\``)
        if (!expectation && previous) notes.push(`retired in \`${resolution.version.id}\``)
        if (expectation && previous && expectation.definitionPath !== previous.definitionPath) {
            notes.push(`redefined in \`${resolution.version.id}\``)
        }
        previous = expectation
    })
    return notes.length > 0 ? notes.join(', ') : 'all'
}

/**
 * The tiers in order, each with what meeting it means.
 * @param {Tier[]} tiers
 * @returns {string[]}
 */
function tierSummaryLines(tiers) {
    /** @type {Row[]} */
    const rows = tiers.map((tier) => ({ cells: [{ id: tierLabel(tier) }, tier.description] }))
    return htmlTableLines(['Tier', 'What meeting it means'], rows)
}

/**
 * The versions in order, each with what it is.
 * @param {Version[]} versions
 * @returns {string[]}
 */
function versionSummaryLines(versions) {
    /** @type {Row[]} */
    const rows = versions.map((version) => ({ cells: [{ id: version.id }, version.description] }))
    return htmlTableLines(['Version', 'What it is'], rows)
}

/**
 * Every tier's expectations in one table, each tier introduced by a band, so that the
 * columns align down the whole of it however long a summary runs.
 * @param {Resolution}   latest       the latest version's
 * @param {Resolution[]} resolutions  every version's, in order
 * @returns {string[]}
 */
function tierExpectationLines(latest, resolutions) {
    /** @type {(Row|Band)[]} */
    const rows = []
    for (const tier of latest.tiers) {
        rows.push({ label: tierLabel(tier), status: '' })
        for (const expectation of latest.expectations.filter((each) => each.tier.number === tier.number)) {
            rows.push({ cells: [{ code: expectation.name }, expectation.summary, versionsColumnOf(expectation.name, resolutions)] })
        }
    }
    return htmlTableLines(['Expectation', 'What it requires', 'Versions'], rows)
}

/**
 * The changed lines between two texts, with two lines of context, in the form of a unified diff without its headers.
 * @param {string} before
 * @param {string} after
 * @returns {string[]}
 */
function changedLines(before, after) {
    const a = before.split('\n')
    const b = after.split('\n')
    /** @type {number[][]} */ const common = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
    for (let i = a.length - 1; i >= 0; i -= 1) {
        for (let j = b.length - 1; j >= 0; j -= 1) {
            common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1])
        }
    }

    /** @type {{mark: string, text: string}[]} */ const lines = []
    let i = 0
    let j = 0
    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) {
            lines.push({ mark: ' ', text: a[i] }); i += 1; j += 1
        } else if (i < a.length && (j === b.length || common[i + 1][j] >= common[i][j + 1])) {
            lines.push({ mark: '-', text: a[i] }); i += 1
        } else {
            lines.push({ mark: '+', text: b[j] }); j += 1
        }
    }

    const near = lines.map((_, index) =>
        lines.slice(Math.max(0, index - 2), index + 3).some((line) => line.mark !== ' '))
    /** @type {string[]} */ const shown = []
    lines.forEach((line, index) => {
        if (near[index]) shown.push(`${line.mark} ${line.text}`)
        else if (index > 0 && near[index - 1]) shown.push('  …')
    })
    return shown
}

/**
 * @param {string}   heading
 * @param {string}   before
 * @param {string}   after
 * @returns {string[]}  the heading and a diff block of the changes
 */
function diffSection(heading, before, after) {
    return [heading, '', '```diff', ...changedLines(before, after), '```', '']
}

/**
 * What each version changed from the one before: the expectations it adds and retires, and the diff of every file it
 * replaces, tiers.json included.
 * @param {Resolution[]} resolutions  every version's, in order
 * @returns {string[]}
 */
function versionHistoryLines(resolutions) {
    const lines = [
        '# Version history',
        '',
        'What each version of the Specification changes in the expectations, from the version before it. Generated from '
            + '`exports/versions/` by `make update-readme`; not to be edited by hand.',
        '',
        `\`${resolutions[0].version.id}\` is the first version: its directory holds every expectation it lists.`,
        '',
    ]
    for (let index = 1; index < resolutions.length; index += 1) {
        const before = resolutions[index - 1]
        const after = resolutions[index]
        const names = (/** @type {Resolution} */ resolution) => resolution.expectations.map((each) => each.name)

        lines.push(`## \`${after.version.id}\``, '')
        const added = names(after).filter((name) => !names(before).includes(name))
        const retired = names(before).filter((name) => !names(after).includes(name))
        if (added.length > 0) lines.push(`Adds ${added.map((name) => `\`${name}\``).join(', ')}.`, '')
        if (retired.length > 0) lines.push(`Retires ${retired.map((name) => `\`${name}\``).join(', ')}.`, '')

        const tiersJson = (/** @type {Tier[]} */ tiers) => JSON.stringify(tiers.map(({ number, ...tier }) => tier), null, 4)
        if (tiersJson(before.tiers) !== tiersJson(after.tiers)) {
            lines.push(...diffSection('### `tiers.json`', tiersJson(before.tiers), tiersJson(after.tiers)))
        }
        for (const expectation of after.expectations) {
            const previous = before.expectations.find((each) => each.name === expectation.name)
            if (!previous || previous.definitionPath === expectation.definitionPath) continue
            lines.push(...diffSection(`### \`${expectation.name}\``,
                fs.readFileSync(previous.definitionPath, 'utf8'), fs.readFileSync(expectation.definitionPath, 'utf8')))
        }
        if (lines[lines.length - 2] === `## \`${after.version.id}\``) lines.push('Changes nothing.', '')
    }
    return lines
}

/**
 * Replaces what lies between a region's markers, which stay.
 * @param {string}   readme
 * @param {string}   region
 * @param {string[]} lines
 * @returns {string}
 * @throws {Error} if the region's markers are not both present, in order.
 */
function withRegion(readme, region, lines) {
    const { opening, closing } = markersOf(region)
    const from = readme.indexOf(opening)
    const to = readme.indexOf(closing)
    if (from < 0 || to < 0) throw new Error(`the README has no ${region} region`)
    if (to < from) throw new Error(`the README's ${region} markers are the wrong way round`)
    return `${readme.slice(0, from + opening.length)}\n\n${lines.join('\n')}\n\n${readme.slice(to)}`
}

/**
 * @param {string} repository  the top-level directory of a clone
 */
function writeReadme(repository) {
    const readmePath = path.join(repository, 'README.md')
    const versions = checkTro.readVersionDefinitions()
    const resolutions = versions.map((version) => checkTro.resolveVersion(version))
    const latest = resolutions[resolutions.length - 1]

    let readme = fs.readFileSync(readmePath, 'utf8')
    readme = withRegion(readme, TIER_SUMMARY, tierSummaryLines(latest.tiers))
    readme = withRegion(readme, VERSION_SUMMARY, versionSummaryLines(versions))
    readme = withRegion(readme, TIER_EXPECTATIONS, tierExpectationLines(latest, resolutions))
    fs.writeFileSync(readmePath, readme)
    process.stdout.write(`wrote ${readmePath}; ${latest.tiers.length} tiers, ${latest.expectations.length} expectations `
        + `under ${latest.version.id}\n`)

    const historyPath = path.join(repository, HISTORY_PATH)
    fs.writeFileSync(historyPath, versionHistoryLines(resolutions).join('\n'))
    process.stdout.write(`wrote ${historyPath}; ${versions.length} versions\n`)
}

if (require.main === module) {
    const [repository] = process.argv.slice(2)
    if (!repository) throw new Error('usage: node render-readme.js <repository directory>')
    writeReadme(repository)
}

module.exports = { writeReadme }
