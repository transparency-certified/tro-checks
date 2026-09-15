#!/usr/bin/env node
//
// Check every candidate and write one report each. A candidate is checked
// against the target given here, or the one its entry in
// candidates/manifest.json declares, or the assumed tier.
//
//   check-tros --candidates DIR --reports DIR [--target TIER]

// @ts-check

const fs = require('node:fs')
const { parseArgs } = require('node:util')
const path = require('node:path')

const checkTro = require('./check-tro.js')

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Candidate} Candidate */
/**
 * @typedef {object} ManifestEntry  what candidates/manifest.json says about one candidate
 * @property {string} [target]       the id of the tier it aims at
 * @property {string} [description]  copied into its report
 */

const CANDIDATE_SUFFIX = '.jsonld'
const MANIFEST_NAME = 'manifest.json'

/**
 * @param {string} candidatesDirectory
 * @returns {Object<string, ManifestEntry>}  keyed by candidate name
 * @throws {Error} if the directory or the manifest is missing, the manifest cannot be read or parsed, or it names no candidates.
 */
function readCandidatesManifest(candidatesDirectory) {
    if (!fs.existsSync(candidatesDirectory) || !fs.statSync(candidatesDirectory).isDirectory()) {
        throw new Error(`no candidates directory at ${candidatesDirectory}`)
    }

    const manifestPath = path.join(candidatesDirectory, MANIFEST_NAME)
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`no ${MANIFEST_NAME} in ${candidatesDirectory}`)
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

    if (Object.keys(manifest).length === 0) {
        throw new Error(`${MANIFEST_NAME} names no candidates`)
    }

    return manifest
}

/**
 * @param {Object<string, ManifestEntry>} candidatesManifest
 * @param {string} candidatesDirectory
 * @returns {string[]}  the names, sorted
 * @throws {Error} if an entry names a file that is not in the directory.
 */
function vetCandidateNames(candidatesManifest, candidatesDirectory) {
    const names = Object.keys(candidatesManifest).sort()

    const absent = names.filter((name) =>
        !fs.existsSync(path.join(candidatesDirectory, `${name}${CANDIDATE_SUFFIX}`)))
    if (absent.length > 0) {
        throw new Error(`no candidate file for ${absent.join(', ')}`)
    }

    return names
}

/**
 * @param {string}        name
 * @param {ManifestEntry} entry
 * @param {string}        candidatesDirectory
 * @param {Tier}          [overrideTier]  the tier given on the command line, where one was
 * @returns {Candidate}
 * @throws {Error} if the entry names a tier that does not exist.
 */
function buildCandidate(name, entry, candidatesDirectory, overrideTier) {
    /** @type {Tier|undefined} */ let declaredTier
    if (entry.target !== undefined) {
        declaredTier = checkTro.lookUpTier(entry.target)
    }

    /** @type {Candidate['targetSource']} */ let targetSource = 'default'
    if (declaredTier !== undefined) targetSource = 'manifest'
    if (overrideTier !== undefined) targetSource = 'option'

    return {
        name,
        fileName: `${name}${CANDIDATE_SUFFIX}`,
        path: path.join(candidatesDirectory, `${name}${CANDIDATE_SUFFIX}`),
        description: entry.description,
        targetTier: overrideTier ?? declaredTier ?? checkTro.lookUpTier(ASSUMED_TIER),
        targetSource,
    }
}

/**
 * @param {Object<string, ManifestEntry>} candidatesManifest
 * @param {string} candidatesDirectory
 */
function sayWhatWasSkipped(candidatesManifest, candidatesDirectory) {
    const skipped = fs
        .readdirSync(candidatesDirectory)
        .filter((name) => name.endsWith(CANDIDATE_SUFFIX))
        .filter((name) => candidatesManifest[path.basename(name, CANDIDATE_SUFFIX)] === undefined)
        .sort()

    for (const name of skipped) {
        process.stdout.write(`skipped ${name}; ${MANIFEST_NAME} does not name it\n`)
    }
}

/**
 * @param {Candidate} candidate
 * @param {string}    reportsDirectory
 * @throws {Error} if the candidate cannot be checked, or its report cannot be written.
 */
function reportOn(candidate, reportsDirectory) {
    const reportPath = path.join(reportsDirectory, `${candidate.name}.md`)

    const findings = checkTro.checkCandidateAgainstExpectations(candidate)
    const assessments = checkTro.assessTiers(candidate, findings)

    checkTro.writeReport(reportPath, candidate, findings, assessments)
    process.stdout.write(`${checkTro.summarizeInOneLine(reportPath, assessments)}\n`)
}

/**
 * @param {Candidate[]} candidates
 * @param {string}      reportsDirectory
 * @returns {number}  how many could not be checked
 */
function checkEach(candidates, reportsDirectory) {
    let unreportedCount = 0
    for (const candidate of candidates) {
        try {
            reportOn(candidate, reportsDirectory)
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error)
            process.stderr.write(`${candidate.name}: could not be checked -- ${reason}\n`)
            unreportedCount += 1
        }
    }
    return unreportedCount
}

const USAGE = 'usage: check-tros --candidates DIR --reports DIR [--target TIER]'
const ASSUMED_TIER = 'STANDALONE-TRO'

/** @returns {number}  the exit status */
function runAsCommand() {
    try {
        const optionValues = parseArgs({
            args: process.argv.slice(2),
            options: {
                candidates: { type: 'string' },
                reports: { type: 'string' },
                target: { type: 'string' },
            },
            allowPositionals: false,
        }).values

        const candidatesDirectory = optionValues.candidates
        const reportsDirectory = optionValues.reports
        if (!candidatesDirectory || !reportsDirectory) throw new Error(USAGE)

        /** @type {Tier|undefined} */ let overrideTier
        if (optionValues.target !== undefined) {
            overrideTier = checkTro.lookUpTier(optionValues.target)
        }

        const manifest = readCandidatesManifest(candidatesDirectory)
        const names = vetCandidateNames(manifest, candidatesDirectory)

        sayWhatWasSkipped(manifest, candidatesDirectory)

        const candidates = names.map((name) =>
            buildCandidate(name, manifest[name], candidatesDirectory, overrideTier))

        fs.mkdirSync(reportsDirectory, { recursive: true })

        const unreportedCount = checkEach(candidates, reportsDirectory)
        if (unreportedCount > 0) {
            throw new Error(`${unreportedCount} of ${candidates.length} candidates could not be checked`)
        }

        return 0
    } catch (error) {
        process.stderr.write(`check-tros: ${error instanceof Error ? error.message : String(error)}\n`)
        return 1
    }
}

process.exitCode = runAsCommand()
