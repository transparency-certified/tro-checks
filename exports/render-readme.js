//
// Write the README's account of what is checked from the expectations themselves, so that
// the tiers, the versions, their order and every summary are said once, in the files the
// checker reads.
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
}

if (require.main === module) {
    const [repository] = process.argv.slice(2)
    if (!repository) throw new Error('usage: node render-readme.js <repository directory>')
    writeReadme(repository)
}

module.exports = { writeReadme }
