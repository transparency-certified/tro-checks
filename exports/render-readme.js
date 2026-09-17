//
// Write the README's account of what is checked from the expectations themselves, so that
// the tiers, their order and every summary are said once, in the files the checker reads.
//
//   node render-readme.js <repository directory>
//

// @ts-check

const fs = require('fs')
const path = require('path')

const { htmlTableLines } = require('./render-report.js')

/** @typedef {import('./render-report.js').Row} Row */
/** @typedef {import('./render-report.js').Band} Band */

const TIER_SUMMARY = 'tier-summary'
const TIER_EXPECTATIONS = 'tier-expectations'

/**
 * @param {string} region  the name the markers carry
 * @returns {{opening: string, closing: string}}  the comments the region sits between
 */
function markersOf(region) {
    return { opening: `<!-- generated: ${region} -->`, closing: `<!-- end: ${region} -->` }
}

/**
 * @param {string} exportsDirectory
 * @returns {{id: string, number: number, description: string, expectations: string[]}[]}
 * @throws {Error} if a tier names an expectation no file defines.
 */
function tiersOf(exportsDirectory) {
    const tiers = JSON.parse(fs.readFileSync(path.join(exportsDirectory, 'tiers.json'), 'utf8'))
    return tiers.map((/** @type {*} */ tier, /** @type {number} */ index) => ({ ...tier, number: index + 1 }))
}

/**
 * An expectation's summary, from the file that defines it.
 * @param {string} exportsDirectory
 * @param {string} name
 * @returns {string}
 * @throws {Error} if no file defines the expectation, or the file gives no summary.
 */
function summaryOf(exportsDirectory, name) {
    for (const suffix of ['schema', 'parse']) {
        const definitionPath = path.join(exportsDirectory, `${name}.${suffix}.json`)
        if (!fs.existsSync(definitionPath)) continue
        const { summary } = JSON.parse(fs.readFileSync(definitionPath, 'utf8'))
        if (!summary) throw new Error(`no summary in ${name}.${suffix}.json`)
        return summary
    }
    throw new Error(`no file defines the expectation ${name}`)
}

/**
 * The tiers in order, each with what meeting it means.
 * @param {ReturnType<tiersOf>} tiers
 * @returns {string[]}
 */
function tierSummaryLines(tiers) {
    /** @type {Row[]} */
    const rows = tiers.map((tier) => ({
        cells: [String(tier.number), { atom: tier.id }, tier.description],
    }))
    return htmlTableLines(['Tier', 'ID', 'What meeting it means'], rows)
}

/**
 * Every tier's expectations in one table, each tier introduced by a band, so that the
 * columns align down the whole of it however long a summary runs.
 * @param {ReturnType<tiersOf>} tiers
 * @param {string} exportsDirectory
 * @returns {string[]}
 */
function tierExpectationLines(tiers, exportsDirectory) {
    /** @type {(Row|Band)[]} */
    const rows = []
    for (const tier of tiers) {
        rows.push({ label: `Tier ${tier.number} — ${tier.id}`, status: '' })
        for (const name of tier.expectations) {
            rows.push({ cells: [{ code: name }, summaryOf(exportsDirectory, name)] })
        }
    }
    return htmlTableLines(['Expectation', 'What it checks'], rows)
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
    const exportsDirectory = path.join(repository, 'exports')
    const readmePath = path.join(repository, 'README.md')
    const tiers = tiersOf(exportsDirectory)

    let readme = fs.readFileSync(readmePath, 'utf8')
    readme = withRegion(readme, TIER_SUMMARY, tierSummaryLines(tiers))
    readme = withRegion(readme, TIER_EXPECTATIONS, tierExpectationLines(tiers, exportsDirectory))
    fs.writeFileSync(readmePath, readme)

    const expectations = tiers.reduce((count, tier) => count + tier.expectations.length, 0)
    process.stdout.write(`wrote ${readmePath}; ${tiers.length} tiers, ${expectations} expectations\n`)
}

if (require.main === module) {
    const [repository] = process.argv.slice(2)
    if (!repository) throw new Error('usage: node render-readme.js <repository directory>')
    writeReadme(repository)
}

module.exports = { writeReadme }
