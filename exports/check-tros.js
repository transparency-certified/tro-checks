#!/usr/bin/env node
//
// Check every candidate against each of its targets, write one report per
// target, and write a summary of the reports. A candidate's targets are those
// its entry in candidates/manifest.json declares, or the assumed tier and
// version. A tier or version given here replaces that half of every target.
//
//   check-tros --candidates DIR --reports DIR [--target-tier TIER] [--target-version VERSION]

// @ts-check

const fs = require('node:fs')
const { parseArgs } = require('node:util')
const path = require('node:path')

const checkTro = require('./check-tro.js')
const { renderSummaryAsMarkdown, renderIntegratedReportAsMarkdown, tierLabel } = require('./render-report.js')

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Version} Version */
/** @typedef {import('./types.js').Candidate} Candidate */
/** @typedef {import('./render-report.js').WrittenReport} WrittenReport */
/**
 * @typedef {object} DeclaredTarget  one target as a manifest entry writes it
 * @property {string} [tier]     the id of the tier aimed at
 * @property {string} [version]  the id of the version it is aimed at under
 */
/**
 * @typedef {object} ManifestEntry  what candidates/manifest.json says about one candidate
 * @property {DeclaredTarget|DeclaredTarget[]} [target]  its target, or its targets
 * @property {string} [title]        heads its reports in the summary
 * @property {string} [description]  copied into its reports
 */

const CANDIDATE_SUFFIX = '.jsonld'
const MANIFEST_NAME = 'manifest.json'
const REPORT_SUFFIX = '.md'
const SUMMARY_NAME = 'README.md'
const INTEGRATED_NAME = 'integrated-report.md'

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
 * @returns {DeclaredTarget[]}  the targets the entry declares, in the order it lists them: one with neither half
 *   where it declares none
 * @throws {Error} if the entry's target is not an object with no member other than `tier` and `version`, or a list
 *   of at least one such object.
 */
function declaredTargetsOf(name, entry) {
    if (entry.target === undefined) return [{}]

    const targets = Array.isArray(entry.target) ? entry.target : [entry.target]
    const wellFormed = targets.length > 0 && targets.every((target) =>
        target !== null && typeof target === 'object' && !Array.isArray(target)
        && Object.keys(target).every((key) => key === 'tier' || key === 'version'))
    if (!wellFormed) {
        throw new Error(`${name}: a target is an object giving a tier, a version, or both, or a list of such objects`)
    }

    return targets
}

/**
 * Builds the candidate once for each of its targets. A tier or version given on the command line replaces that half
 * of every target, and targets that are then the same are kept once.
 * @param {string}        name
 * @param {ManifestEntry} entry
 * @param {string}        candidatesDirectory
 * @param {string}        [overrideTierId]   the tier given on the command line, where one was
 * @param {Version}       [overrideVersion]  the version given on the command line, where one was
 * @returns {Candidate[]}  one per target, in the order the entry lists them
 * @throws {Error} if the entry's title is not a string, or its target is not an object giving a tier, a version,
 *   or both, or a list of them, names a version that does not exist or a tier its version does not have, or lists the
 *   same target twice.
 */
function buildCandidates(name, entry, candidatesDirectory, overrideTierId, overrideVersion) {
    if (entry.title !== undefined && typeof entry.title !== 'string') throw new Error(`${name}: a title is a string`)

    /** @type {Candidate[]} */ const candidates = []
    for (const declared of declaredTargetsOf(name, entry)) {
        /** @type {Version|undefined} */ let declaredVersion
        if (declared.version !== undefined) declaredVersion = checkTro.lookUpVersion(declared.version)
        const targetVersion = overrideVersion ?? declaredVersion ?? checkTro.lookUpVersion(checkTro.ASSUMED_VERSION)

        /** @type {Candidate['targetTierSource']} */ let targetTierSource = 'default'
        if (declared.tier !== undefined) targetTierSource = 'manifest'
        if (overrideTierId !== undefined) targetTierSource = 'option'

        /** @type {Candidate['targetVersionSource']} */ let targetVersionSource = 'default'
        if (declaredVersion !== undefined) targetVersionSource = 'manifest'
        if (overrideVersion !== undefined) targetVersionSource = 'option'

        /** @type {Candidate} */ const candidate = {
            name,
            fileName: `${name}${CANDIDATE_SUFFIX}`,
            path: path.join(candidatesDirectory, `${name}${CANDIDATE_SUFFIX}`),
            title: entry.title,
            description: entry.description,
            descriptionSource: entry.description !== undefined ? 'manifest' : undefined,
            targetTier: checkTro.lookUpTier(overrideTierId ?? declared.tier ?? checkTro.ASSUMED_TIER, targetVersion),
            targetVersion,
            targetTierSource,
            targetVersionSource,
        }

        const repeated = candidates.some((each) =>
            each.targetTier.id === candidate.targetTier.id && each.targetVersion.id === candidate.targetVersion.id)
        if (repeated && overrideTierId === undefined && overrideVersion === undefined) {
            throw new Error(`${name}: lists the target ${candidate.targetTier.id} under ${candidate.targetVersion.id} twice`)
        }
        if (!repeated) candidates.push(candidate)
    }

    return candidates
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
 * @returns {string}  the name of the file its report is written to, reading as what was checked: the candidate at its
 *   target version, to its target tier -- 02-readme-trs-declaration__at__trace-0.1__to__tier-6.md
 */
function reportFileNameOf(candidate) {
    const { name, targetVersion, targetTier } = candidate
    return `${name}__at__${targetVersion.id}__to__tier-${targetTier.number}${REPORT_SUFFIX}`
}

/**
 * @param {Candidate} candidate
 * @param {string}    reportsDirectory
 * @returns {WrittenReport}
 * @throws {Error} if the candidate cannot be checked, or its report cannot be written.
 */
function reportOn(candidate, reportsDirectory) {
    const fileName = reportFileNameOf(candidate)
    const reportPath = path.join(reportsDirectory, fileName)

    candidate.createdWith = checkTro.statedCreator(candidate)
    const findings = checkTro.checkCandidateAgainstExpectations(candidate)
    const assessments = checkTro.assessTiers(candidate, findings)

    checkTro.writeReport(reportPath, candidate, findings, assessments)
    process.stdout.write(`${checkTro.summarizeInOneLine(reportPath, assessments)}\n`)

    return { candidate, fileName, findings, assessments }
}

/**
 * @param {Candidate[]} candidates
 * @param {string}      reportsDirectory
 * @returns {{written: WrittenReport[], unreportedCount: number}}  the reports written, and how many candidates
 *   could not be checked against a target
 */
function checkEach(candidates, reportsDirectory) {
    /** @type {WrittenReport[]} */ const written = []
    let unreportedCount = 0
    for (const candidate of candidates) {
        try {
            written.push(reportOn(candidate, reportsDirectory))
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error)
            const target = `${tierLabel(candidate.targetTier)} at version ${candidate.targetVersion.id}`
            process.stderr.write(`${candidate.name}, ${target}: could not be checked -- ${reason}\n`)
            unreportedCount += 1
        }
    }
    return { written, unreportedCount }
}

/**
 * Writes the summary of the reports a run wrote, and the document holding the summary and every report, and says
 * which reports in the directory the run did not write.
 * @param {WrittenReport[]} written
 * @param {string}          reportsDirectory
 * @throws {Error} if the summary cannot be written, or the directory cannot be listed.
 */
function summarize(written, reportsDirectory) {
    const summaryPath = path.join(reportsDirectory, SUMMARY_NAME)
    fs.writeFileSync(summaryPath, renderSummaryAsMarkdown(written))
    process.stdout.write(`wrote ${summaryPath}; ${written.length} ${written.length === 1 ? 'report' : 'reports'}\n`)

    const integratedPath = path.join(reportsDirectory, INTEGRATED_NAME)
    fs.writeFileSync(integratedPath, renderIntegratedReportAsMarkdown(written))
    process.stdout.write(`wrote ${integratedPath}; the summary and every report in one document\n`)

    const writtenNames = written.map((report) => report.fileName)
    const leftOver = fs
        .readdirSync(reportsDirectory)
        .filter((name) => name.endsWith(REPORT_SUFFIX) && ![SUMMARY_NAME, INTEGRATED_NAME].includes(name)
            && !writtenNames.includes(name))
        .sort()

    for (const name of leftOver) {
        process.stdout.write(`left ${name}; this run did not write it\n`)
    }
}

const USAGE = 'usage: check-tros --candidates DIR --reports DIR [--target-tier TIER] [--target-version VERSION]'

/** @returns {number}  the exit status */
function runAsCommand() {
    try {
        const optionValues = parseArgs({
            args: process.argv.slice(2),
            options: {
                candidates: { type: 'string' },
                reports: { type: 'string' },
                'target-tier': { type: 'string' },
                'target-version': { type: 'string' },
            },
            allowPositionals: false,
        }).values

        const candidatesDirectory = optionValues.candidates
        const reportsDirectory = optionValues.reports
        if (!candidatesDirectory || !reportsDirectory) throw new Error(USAGE)

        const overrideTierId = optionValues['target-tier']

        /** @type {Version|undefined} */ let overrideVersion
        if (optionValues['target-version'] !== undefined) {
            overrideVersion = checkTro.lookUpVersion(optionValues['target-version'])
        }

        const manifest = readCandidatesManifest(candidatesDirectory)
        const names = vetCandidateNames(manifest, candidatesDirectory)

        sayWhatWasSkipped(manifest, candidatesDirectory)

        const candidates = names.flatMap((name) =>
            buildCandidates(name, manifest[name], candidatesDirectory, overrideTierId, overrideVersion))

        fs.mkdirSync(reportsDirectory, { recursive: true })

        const { written, unreportedCount } = checkEach(candidates, reportsDirectory)
        summarize(written, reportsDirectory)

        if (unreportedCount > 0) {
            throw new Error(`${unreportedCount} of ${candidates.length} reports could not be written`)
        }

        return 0
    } catch (error) {
        process.stderr.write(`check-tros: ${error instanceof Error ? error.message : String(error)}\n`)
        return 1
    }
}

process.exitCode = runAsCommand()
