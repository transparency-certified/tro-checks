#!/usr/bin/env node
//
// Check one candidate against the expectations in its target and write the report.
//
//   check-tro --candidate FILE --report FILE [--target TIER] [--description TEXT] [--compact]

// @ts-check

const childProcess = require('node:child_process')
const { parseArgs } = require('node:util')
const fs = require('node:fs')
const path = require('node:path')
const { renderReportAsMarkdown } = require('./render-report.js')

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Expectation} Expectation */
/** @typedef {import('./types.js').Candidate} Candidate */
/** @typedef {import('./types.js').Assessment} Assessment */
/** @typedef {import('./types.js').Finding} Finding */
/** @typedef {import('./types.js').ErrorReport} ErrorReport */
/** @typedef {import('./types.js').ValidatorReport} ValidatorReport */
/**
 * @typedef {object} Determination  what one validator determined about one candidate against one expectation
 * @property {string}      validator
 * @property {Expectation} expectation
 * @property {boolean}     valid
 * @property {ValidatorReport} report
 */

module.exports = {
    lookUpTier,
    checkCandidateAgainstExpectations,
    assessTiers,
    writeReport,
    summarizeInOneLine,
}

const VALIDATORS = ['jsonschema-validate', 'ajv-validate']

/** @type {{ MET: 'met', UNMET: 'unmet', NOT_CLAIMED: 'not claimed' }} */ const EXPECTATION = {
    MET: 'met',
    UNMET: 'unmet',
    NOT_CLAIMED: 'not claimed',
}

const expectationsDirectory = __dirname

/**
 * @returns {Tier[]}  in ascending order
 * @throws {Error} if the tier definitions cannot be read or parsed.
 */
function readTierDefinitions() {
    const definitions = JSON.parse(
        fs.readFileSync(path.join(expectationsDirectory, 'tiers.json'), 'utf8'))

    return Object.keys(definitions)
        .map((key) => ({ number: Number(key), ...definitions[key] }))
        .sort((one, other) => one.number - other.number)
}

/**
 * @param {number} tierNumber
 * @returns {Tier}
 * @throws {Error} if the tier definitions cannot be read, or name no such tier.
 */
function lookUpTier(tierNumber) {
    const tiers = readTierDefinitions()
    const tier = tiers.find((each) => each.number === tierNumber)

    if (!tier) {
        throw new Error(`no tier ${tierNumber}; the tiers are ${tiers.map((each) => each.number).join(', ')}`)
    }

    return tier
}

/**
 * @returns {string[]}  the paths, in name order
 * @throws {Error} if the module's own directory cannot be listed.
 */
function findExpectationFiles() {
    return fs
        .readdirSync(expectationsDirectory)
        .filter((name) => name.endsWith('.schema.json'))
        .sort()
        .map((name) => path.join(expectationsDirectory, name))
}

/**
 * @param {Tier[]} tiers
 * @param {string} name
 * @returns {Tier}
 * @throws {Error} if the expectation belongs to no tier.
 */
function tierOfExpectation(tiers, name) {
    const tier = tiers.find((each) => each.expectations.includes(name))
    if (!tier) throw new Error(`${name} belongs to no tier`)
    return tier
}

/**
 * @param {Tier[]}   tiers
 * @param {string[]} expectationPaths
 * @throws {Error} if a tier lists an expectation that has no file.
 */
function vetTierExpectations(tiers, expectationPaths) {
    const names = expectationPaths.map((expectationPath) => path.basename(expectationPath, '.schema.json'))

    for (const tier of tiers) {
        const absent = tier.expectations.filter((name) => !names.includes(name))
        if (absent.length > 0) {
            throw new Error(`no expectation file for ${absent.join(', ')}, listed in tier ${tier.number}`)
        }
    }
}

/**
 * Has a validator make its determination: runs it on the candidate against the expectation, and reads back its JSON report.
 * @param {string}      validator  the command
 * @param {Expectation} expectation
 * @param {string}      candidatePath
 * @returns {Determination}
 * @throws {Error} if the validator cannot be run, is killed, exits with an unrecognized status, or writes no readable report.
 */
function makeDetermination(validator, expectation, candidatePath) {
    const childResult = childProcess.spawnSync(
        validator,
        ['--schema', expectation.path, '--instance', candidatePath, '--json', '-'],
        { encoding: 'utf8' }
    )

    if (childResult.error) throw new Error(`${validator}: ${childResult.error.message}`)

    let diagnostics = ''
    if (childResult.stderr) diagnostics = childResult.stderr.trimEnd()
    if (childResult.signal) throw new Error(`${validator}: killed by ${childResult.signal}\n${diagnostics}`)

    let valid
    switch (childResult.status) {
        case 0: valid = true; break
        case 1: valid = false; break
        default: throw new Error(`${validator}: exit status ${childResult.status}\n${diagnostics}`)
    }

    let report
    try {
        report = JSON.parse(childResult.stdout)
    } catch (error) {
        throw new Error(`${validator}: wrote no readable report: ${String(error)}\n${diagnostics}`)
    }
    return { validator, expectation, valid, report }
}

/**
 * Copies an error report leaving out its message, and its rejections' error reports' likewise.
 * @param {ErrorReport} errorReport
 * @returns {ErrorReport}
 */
function withoutMessage(errorReport) {
    const copy = Object.assign({}, errorReport)
    delete copy.message

    if (copy.rejections !== undefined) {
        const rejections = []
        for (const rejection of copy.rejections) {
            const rejectionCopy = Object.assign({}, rejection)
            rejectionCopy.errors = []
            for (const error of rejection.errors) rejectionCopy.errors.push(withoutMessage(error))
            rejections.push(rejectionCopy)
        }
        copy.rejections = rejections
    }

    return copy
}

/**
 * Whether two error reports report the same error, whatever their messages.
 * @param {ErrorReport} errorReport
 * @param {ErrorReport} other
 * @returns {boolean}
 */
function isSameError(errorReport, other) {
    return JSON.stringify(withoutMessage(errorReport)) === JSON.stringify(withoutMessage(other))
}

/**
 * Whether two reports of the same error carry the same messages, their rejections' included.
 * @param {ErrorReport} errorReport
 * @param {ErrorReport} other
 * @returns {boolean}
 */
function isSameMessage(errorReport, other) {
    return JSON.stringify(errorReport) === JSON.stringify(other)
}

/**
 * Reconciles what the validators that found the candidate invalid reported: every error any of them reported, once,
 * with its message where every validator that gave one gave the same. Says on stderr when their reports differ.
 * @param {Determination[]} determinedInvalid
 * @returns {ErrorReport[]}  in the order first reported
 */
function reconcileErrorReports(determinedInvalid) {
    /** @type {ErrorReport[]} */ const errorReports = []
    for (const determination of determinedInvalid) {
        for (const errorReport of determination.report.errors) errorReports.push(errorReport)
    }

    /** @type {ErrorReport[]} */ const errors = []
    let reportsDiffer = false
    for (const errorReport of errorReports) {
        if (!errors.some((error) => isSameError(error, errorReport))) {
            const reportsOfThisError = errorReports.filter((one) => isSameError(one, errorReport))
            const reportsWithMessage = reportsOfThisError.filter((one) => one.message !== undefined)

            if (reportsWithMessage.length === 0) {
                errors.push(errorReport)
            } else if (reportsWithMessage.every((one) => isSameMessage(one, reportsWithMessage[0]))) {
                errors.push(reportsWithMessage[0])
            } else {
                errors.push(withoutMessage(reportsWithMessage[0]))
            }

            if (reportsOfThisError.length !== determinedInvalid.length) reportsDiffer = true
        }
    }

    if (reportsDiffer) {
        const counts = determinedInvalid.map((determination) => `${determination.validator}: ${determination.report.errors.length}`)
        const expectationName = determinedInvalid[0].expectation.name
        process.stderr.write(`check-tro: ${expectationName}: the validators' reports differ (${counts.join(', ')})\n`)
    }

    return errors
}

/**
 * Checks the candidate against one expectation: has every validator make its determination,
 * and reconciles what those finding it invalid reported.
 * @param {Candidate}   candidate
 * @param {Expectation} expectation
 * @returns {Finding}
 * @throws {Error} if a validator makes no determination.
 */
function checkExpectation(candidate, expectation) {
    /** @type {Determination[]} */ const determinedValid = []
    /** @type {Determination[]} */ const determinedInvalid = []
    for (const validator of VALIDATORS) {
        const determination = makeDetermination(validator, expectation, candidate.path)
        if (determination.valid) {
            determinedValid.push(determination)
        } else {
            determinedInvalid.push(determination)
        }
    }

    /** @type {Finding} */ let finding
    if (determinedValid.length === VALIDATORS.length) {
        finding = { expectation, outcome: EXPECTATION.MET, errors: [] }
    } else {        
        if (determinedValid.length > 0) {
            process.stderr.write(`check-tro: ${expectation.name}: ${validatorNames(determinedValid)} found the candidate valid `
            + `and ${validatorNames(determinedInvalid)} found it invalid\n`)
        }
        finding = { expectation, outcome: EXPECTATION.UNMET, errors: reconcileErrorReports(determinedInvalid) }
    }

    return finding
}

/**
 * Orders findings by tier, and by name within a tier.
 * @param {Finding} one
 * @param {Finding} other
 * @returns {number}
 */
function byTierThenName(one, other) {
    let order = one.expectation.tier.number - other.expectation.tier.number
    if (order === 0) order = one.expectation.name.localeCompare(other.expectation.name)
    return order
}

/**
 * @param {Candidate} candidate
 * @returns {Finding[]}  in tier order, and by name within a tier
 * @throws {Error} if the expectations cannot be listed, one belongs to no tier, or a validator makes no determination.
 */
function checkCandidateAgainstExpectations(candidate) {
    const tiers = readTierDefinitions()
    const expectationPaths = findExpectationFiles()
    vetTierExpectations(tiers, expectationPaths)

    /** @type {Finding[]} */ const findings = []
    for (const expectationPath of expectationPaths) {
        const name = path.basename(expectationPath, '.schema.json')
        const expectation = { name, path: expectationPath, tier: tierOfExpectation(tiers, name) }

        if (expectation.tier.number > candidate.targetTier.number) {
            findings.push({ expectation, outcome: EXPECTATION.NOT_CLAIMED, errors: [] })
        } else {
            findings.push(checkExpectation(candidate, expectation))
        }
    }

    return findings.sort(byTierThenName)
}

/**
 * @param {Candidate} candidate
 * @param {Finding[]} findings
 * @returns {Assessment[]}  one per tier at or below the target
 */
function assessTiers(candidate, findings) {
    /** @param {Tier} tier */
    const unmetIn = (tier) => findings.some(
        (finding) => finding.expectation.tier.number === tier.number && finding.outcome === EXPECTATION.UNMET)

    return readTierDefinitions()
        .filter((tier) => tier.number <= candidate.targetTier.number)
        .map((tier) => ({ tier, outcome: unmetIn(tier) ? EXPECTATION.UNMET : EXPECTATION.MET }))
}

/**
 * @param {Determination[]} determinations
 * @returns {string}  the validators' names, for a diagnostic
 */
function validatorNames(determinations) {
    return determinations.map((determination) => `\`${determination.validator}\``).join(' and ')
}


/**
 * @param {string}       reportPath
 * @param {Candidate}    candidate
 * @param {Finding[]}    findings
 * @param {Assessment[]} assessments
 * @param {boolean}      [compactly]
 * @throws {Error} if the report cannot be written.
 */
function writeReport(reportPath, candidate, findings, assessments, compactly) {
    fs.writeFileSync(
        reportPath,
        renderReportAsMarkdown(candidate, findings, assessments, compactly))
}

/**
 * @param {string}       reportPath
 * @param {Assessment[]} assessments
 * @returns {string}
 */
function summarizeInOneLine(reportPath, assessments) {
    const verdicts = assessments.map(
        (assessment) => `Tier ${assessment.tier.number} ${assessment.outcome}`)

    return `wrote ${reportPath}; ${verdicts.join(', ')}`
}

const USAGE =
    'usage: check-tro --candidate FILE --report FILE [--target TIER] [--description TEXT] [--compact]'

const ASSUMED_TIER = 1

const EXIT = {
    ALL_CLAIMED_TIERS_MET: 0,
    SOME_CLAIMED_TIER_UNMET: 1,
    COULD_NOT_CHECK: 2,
}

/** @returns {number}  the exit status */
function runAsCommand() {
    try {
        const optionValues = parseArgs({
            args: process.argv.slice(2),
            options: {
                candidate: { type: 'string' },
                report: { type: 'string' },
                target: { type: 'string' },
                description: { type: 'string' },
                compact: { type: 'boolean' },
            },
            allowPositionals: false,
        }).values

        const candidatePath = optionValues.candidate
        const reportPath = optionValues.report
        if (!candidatePath || !reportPath) throw new Error(USAGE)

        const targetSource = optionValues.target !== undefined ? 'option' : 'default'
        const targetTier = lookUpTier(targetSource === 'option' ? Number(optionValues.target) : ASSUMED_TIER)
        const candidateDescription = optionValues.description

        /** @type {Candidate} */ const candidate = {
            fileName: path.basename(candidatePath),
            path: candidatePath,
            description: candidateDescription,
            targetTier,
            targetSource,
        }

        const findings = checkCandidateAgainstExpectations(candidate)
        const assessments = assessTiers(candidate, findings)

        writeReport(reportPath, candidate, findings, assessments, optionValues.compact)
        process.stdout.write(`${summarizeInOneLine(reportPath, assessments)}\n`)

        return assessments.some((assessment) => assessment.outcome === EXPECTATION.UNMET)
            ? EXIT.SOME_CLAIMED_TIER_UNMET
            : EXIT.ALL_CLAIMED_TIERS_MET
    } catch (error) {
        process.stderr.write(`check-tro: ${error instanceof Error ? error.message : String(error)}\n`)
        return EXIT.COULD_NOT_CHECK
    }
}

if (require.main === module) process.exitCode = runAsCommand()
