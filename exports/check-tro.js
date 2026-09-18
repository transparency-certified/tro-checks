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
/** @typedef {import('./types.js').Diagnostic} Diagnostic */
/** @typedef {import('./types.js').ValidatorReport} ValidatorReport */
/**
 * @typedef {object} Determination  what one validator determined about one candidate against one expectation
 * @property {string}      validator
 * @property {Expectation} expectation
 * @property {boolean}     isValid
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

/** @type {{ MET: 'met', UNMET: 'unmet', NOT_ASSESSED: 'not assessed', NOT_CLAIMED: 'not claimed' }} */ const EXPECTATION = {
    MET: 'met',
    UNMET: 'unmet',
    NOT_ASSESSED: 'not assessed',
    NOT_CLAIMED: 'not claimed',
}

/** @type {Object<string, Expectation['instrument']>} */ const INSTRUMENT_OF_SUFFIX = {
    '.schema.json': 'json-schema',
    '.parse.json': 'parse',
}

const expectationsDirectory = __dirname

/**
 * @returns {Tier[]}  in order, each numbered by its place from 1
 * @throws {Error} if the tier definitions cannot be read or parsed, or a tier has no id, no description, or no
 *   expectations, or says whether it blocks higher tiers other than by true or false.
 */
function readTierDefinitions() {
    /** @type {Omit<Tier, 'number'>[]} */ const definitions = JSON.parse(
        fs.readFileSync(path.join(expectationsDirectory, 'tiers.json'), 'utf8'))

    const tiers = definitions.map((definition, index) => ({ ...definition, number: index + 1 }))

    for (const tier of tiers) {
        if (typeof tier.id !== 'string') throw new Error(`tier ${tier.number} has no id`)
        if (typeof tier.description !== 'string') throw new Error(`${tier.id} has no description`)
        if (!Array.isArray(tier.expectations) || tier.expectations.length === 0) {
            throw new Error(`${tier.id} lists no expectations`)
        }
        if (tier.blocksHigherTiers !== undefined && typeof tier.blocksHigherTiers !== 'boolean') {
            throw new Error(`${tier.id} says whether it blocks higher tiers other than by true or false`)
        }
    }

    return tiers
}

/**
 * @param {string} tierId
 * @returns {Tier}
 * @throws {Error} if the tier definitions cannot be read, or name no such tier.
 */
function lookUpTier(tierId) {
    const tiers = readTierDefinitions()
    const tier = tiers.find((each) => each.id === tierId)

    if (!tier) {
        throw new Error(`no tier ${tierId}; the tiers are ${tiers.map((each) => each.id).join(', ')}`)
    }

    return tier
}

/**
 * @param {string} fileName
 * @returns {string|undefined}  the suffix naming the instrument that checks the expectation the file defines, if any
 */
function instrumentSuffixOf(fileName) {
    return Object.keys(INSTRUMENT_OF_SUFFIX).find((suffix) => fileName.endsWith(suffix))
}

/**
 * @param {string} expectationPath
 * @returns {string}  the expectation's name: its file's name without the instrument suffix
 */
function expectationNameOf(expectationPath) {
    const fileName = path.basename(expectationPath)
    const suffix = instrumentSuffixOf(fileName) ?? ''
    return fileName.slice(0, fileName.length - suffix.length)
}

/**
 * @returns {string[]}  the paths of the files defining expectations, in name order
 * @throws {Error} if the module's own directory cannot be listed.
 */
function findExpectationFiles() {
    return fs
        .readdirSync(expectationsDirectory)
        .filter((name) => instrumentSuffixOf(name) !== undefined)
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
 * Reads an expectation from the file defining it: its name, its instrument, its tier, and what the file says it checks.
 * @param {Tier[]} tiers
 * @param {string} expectationPath
 * @returns {Expectation}
 * @throws {Error} if the file cannot be read or parsed, belongs to no tier, has no summary or description,
 *   or has a `requires` that is not a list of names.
 */
function readExpectation(tiers, expectationPath) {
    const name = expectationNameOf(expectationPath)
    const definition = JSON.parse(fs.readFileSync(expectationPath, 'utf8'))

    if (typeof definition.summary !== 'string') throw new Error(`${name} has no summary`)
    if (typeof definition.description !== 'string') throw new Error(`${name} has no description`)

    const requires = definition.requires ?? []
    if (!Array.isArray(requires) || requires.some((each) => typeof each !== 'string')) {
        throw new Error(`${name} has a requires that is not a list of expectation names`)
    }

    const validatorFlags = definition.validatorFlags ?? []
    if (!Array.isArray(validatorFlags) || validatorFlags.some((each) => typeof each !== 'string')) {
        throw new Error(`${name} has validatorFlags that are not a list of options`)
    }

    return {
        name,
        instrument: INSTRUMENT_OF_SUFFIX[instrumentSuffixOf(path.basename(expectationPath)) ?? ''],
        definitionPath: expectationPath,
        tier: tierOfExpectation(tiers, name),
        summary: definition.summary,
        description: definition.description,
        requires,
        validatorFlags,
    }
}

/**
 * Whether following what an expectation requires, among the given expectations, leads back to it.
 * @param {Expectation}   start
 * @param {Expectation[]} among
 * @returns {boolean}
 */
function requiresItself(start, among) {
    const visited = new Set()
    const toVisit = [...start.requires]
    while (toVisit.length > 0) {
        const name = /** @type {string} */ (toVisit.pop())
        if (name === start.name) return true
        if (!visited.has(name)) {
            visited.add(name)
            toVisit.push(...(among.find((each) => each.name === name)?.requires ?? []))
        }
    }
    return false
}

/**
 * Orders one tier's expectations so that each comes after every expectation it requires, and by name otherwise.
 * @param {Expectation[]} tierExpectations
 * @param {Expectation[]} expectations  every expectation, for naming what a requires gets wrong
 * @returns {Expectation[]}
 * @throws {Error} if an expectation requires one that does not exist or is in another tier, or the requirements
 *   form a cycle.
 */
function inRequiredOrder(tierExpectations, expectations) {
    for (const expectation of tierExpectations) {
        for (const name of expectation.requires) {
            const required = expectations.find((each) => each.name === name)
            if (!required) throw new Error(`${expectation.name} requires ${name}, which is no expectation`)
            if (required.tier.number !== expectation.tier.number) {
                throw new Error(`${expectation.name} requires ${name}, which is in ${required.tier.id}, not ${expectation.tier.id}`)
            }
        }
    }

    /** @type {Expectation[]} */ const ordered = []
    let remaining = [...tierExpectations].sort((one, other) => one.name.localeCompare(other.name))
    while (remaining.length > 0) {
        const ready = remaining.filter((expectation) =>
            expectation.requires.every((name) => ordered.some((done) => done.name === name)))
        if (ready.length === 0) {
            const inCycle = remaining.filter((expectation) => requiresItself(expectation, remaining))
            throw new Error(`the requirements among ${inCycle.map((each) => each.name).join(', ')} form a cycle`)
        }
        ordered.push(...ready)
        remaining = remaining.filter((expectation) => !ready.includes(expectation))
    }

    return ordered
}

/**
 * @param {Tier[]}   tiers
 * @param {string[]} expectationPaths
 * @throws {Error} if a tier lists an expectation that has no file.
 */
function vetTierExpectations(tiers, expectationPaths) {
    const names = expectationPaths.map(expectationNameOf)

    for (const tier of tiers) {
        const absent = tier.expectations.filter((name) => !names.includes(name))
        if (absent.length > 0) {
            throw new Error(`no expectation file for ${absent.join(', ')}, listed in ${tier.id}`)
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
        ['--schema', expectation.definitionPath, '--instance', candidatePath, ...expectation.validatorFlags, '--json', '-'],
        { encoding: 'utf8' }
    )

    if (childResult.error) throw new Error(`${validator}: ${childResult.error.message}`)

    let diagnostics = ''
    if (childResult.stderr) diagnostics = childResult.stderr.trimEnd()
    if (childResult.signal) throw new Error(`${validator}: killed by ${childResult.signal}\n${diagnostics}`)

    let isValid
    switch (childResult.status) {
        case 0: isValid = true; break
        case 1: isValid = false; break
        default: throw new Error(`${validator}: exit status ${childResult.status}\n${diagnostics}`)
    }

    let report
    try {
        report = JSON.parse(childResult.stdout)
    } catch (error) {
        throw new Error(`${validator}: wrote no readable report: ${String(error)}\n${diagnostics}`)
    }
    return { validator, expectation, isValid, report }
}

/**
 * Copies a diagnostic leaving out its message, and its attempts' diagnostics' likewise.
 * @param {Diagnostic} diagnostic
 * @returns {Diagnostic}
 */
function withoutMessage(diagnostic) {
    const copy = Object.assign({}, diagnostic)
    delete copy.message

    if (copy.rejections !== undefined) {
        const attempts = []
        for (const attempt of copy.rejections) {
            const attemptCopy = Object.assign({}, attempt)
            attemptCopy.errors = []
            for (const error of attempt.errors) attemptCopy.errors.push(withoutMessage(error))
            attempts.push(attemptCopy)
        }
        copy.rejections = attempts
    }

    return copy
}

/**
 * Whether two diagnostics report the same error, whatever their messages.
 * @param {Diagnostic} diagnostic
 * @param {Diagnostic} other
 * @returns {boolean}
 */
function isSameError(diagnostic, other) {
    return JSON.stringify(withoutMessage(diagnostic)) === JSON.stringify(withoutMessage(other))
}

/**
 * Combines the validators' diagnostics of one error into one, level by level: each diagnostic, its attempts'
 * diagnostics included, keeps its message where every validator that gave one there gave the same.
 * @param {Diagnostic[]} diagnosticsOfOneError  reporting the same error, so alike but for their messages
 * @returns {Diagnostic}
 */
function withAgreedMessages(diagnosticsOfOneError) {
    const copy = Object.assign({}, diagnosticsOfOneError[0])
    delete copy.message

    const messages = diagnosticsOfOneError.map((one) => one.message).filter((message) => message !== undefined)
    if (messages.length > 0 && messages.every((message) => message === messages[0])) copy.message = messages[0]

    if (copy.rejections !== undefined) {
        copy.rejections = copy.rejections.map((attempt, attemptIndex) => ({
            ...attempt,
            errors: attempt.errors.map((_, errorIndex) => withAgreedMessages(
                diagnosticsOfOneError.map((one) => (one.rejections ?? [])[attemptIndex].errors[errorIndex]))),
        }))
    }

    return copy
}

/**
 * Reconciles what the validators that found the candidate invalid reported: every error any of them reported, once,
 * with each message where every validator that gave one gave the same. Says on stderr when their reports differ.
 * @param {Determination[]} determinedInvalid
 * @returns {Diagnostic[]}  in the order first reported
 */
function reconcileDiagnostics(determinedInvalid) {
    /** @type {Diagnostic[]} */ const diagnostics = []
    for (const determination of determinedInvalid) {
        for (const diagnostic of determination.report.errors) diagnostics.push(diagnostic)
    }

    /** @type {Diagnostic[]} */ const errors = []
    let reportsDiffer = false
    for (const diagnostic of diagnostics) {
        if (!errors.some((error) => isSameError(error, diagnostic))) {
            const diagnosticsOfThisError = diagnostics.filter((one) => isSameError(one, diagnostic))
            errors.push(withAgreedMessages(diagnosticsOfThisError))

            if (diagnosticsOfThisError.length !== determinedInvalid.length) reportsDiffer = true
        }
    }

    if (reportsDiffer) {
        const counts = determinedInvalid.map((determination) => `${determination.validator}: ${determination.report.errors.length}`)
        const expectationName = determinedInvalid[0].expectation.name
        process.stderr.write(`check-tro: ${expectationName}: the validators' reports differ (${counts.join(', ')})\n`)
    }

    return errors
}

/** @type {Map<string, string>} */ const candidateTexts = new Map()
/** @type {Map<string, *>} */ const parsedCandidates = new Map()

/**
 * The candidate's text, read once and kept for every check that needs it.
 * @param {Candidate} candidate
 * @returns {string}
 * @throws {Error} if the candidate cannot be read.
 */
function candidateText(candidate) {
    let text = candidateTexts.get(candidate.path)
    if (text === undefined) {
        text = fs.readFileSync(candidate.path, 'utf8')
        candidateTexts.set(candidate.path, text)
    }
    return text
}

/**
 * The candidate parsed as JSON, parsed once and kept for every check that needs it.
 * @param {Candidate} candidate
 * @returns {*}
 * @throws {Error} if the candidate cannot be read or is not JSON.
 */
function parsedCandidate(candidate) {
    if (!parsedCandidates.has(candidate.path)) parsedCandidates.set(candidate.path, JSON.parse(candidateText(candidate)))
    return parsedCandidates.get(candidate.path)
}

/**
 * Visits every value and member name in a parsed JSON value, with where each sits.
 * @param {*} value
 * @param {(string|number)[]} site
 * @param {(value: *, site: (string|number)[], isMemberName: boolean) => void} visit
 */
function visitParsed(value, site, visit) {
    if (Array.isArray(value)) {
        value.forEach((each, index) => visitParsed(each, [...site, index], visit))
    } else if (value !== null && typeof value === 'object') {
        for (const [name, member] of Object.entries(value)) {
            visit(name, [...site, name], true)
            visitParsed(member, [...site, name], visit)
        }
    } else {
        visit(value, site, false)
    }
}

const UNPAIRED_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/

/**
 * The checks check-tro makes itself as it reads a candidate, one per parse expectation, each returning its diagnostics.
 * @type {Object<string, (candidate: Candidate) => Diagnostic[]>}
 */
const PARSE_CHECKS = {
    'utf8-encoded': (candidate) => {
        const bytes = fs.readFileSync(candidate.path)
        try {
            new TextDecoder('utf-8', { fatal: true }).decode(bytes)
        } catch {
            return [{ keyword: 'encoding', clause: [], message: 'the candidate is not valid UTF-8' }]
        }
        return []
    },
    'json-parses': (candidate) => {
        try {
            parsedCandidate(candidate)
        } catch {
            return [{ keyword: 'parse', clause: [], message: 'the candidate is not JSON' }]
        }
        return []
    },
    'lone-surrogates-absent': (candidate) => {
        /** @type {Diagnostic[]} */ const diagnostics = []
        visitParsed(parsedCandidate(candidate), [], (value, site, isMemberName) => {
            if (typeof value === 'string' && UNPAIRED_SURROGATE.test(value)) {
                diagnostics.push({
                    site, keyword: 'surrogate', clause: [], found: value,
                    message: isMemberName ? 'a member name contains no unpaired surrogate' : 'a string contains no unpaired surrogate',
                })
            }
        })
        return diagnostics
    },
    'numbers-within-range': (candidate) => {
        /** @type {Diagnostic[]} */ const diagnostics = []
        visitNumberSources(candidateText(candidate), [], (value, source, site) => {
            if (!Number.isFinite(value)) {
                diagnostics.push({ site, keyword: 'numberRange', clause: [], message: 'a number is within the range of an IEEE 754 double' })
            } else if (/^-?\d+$/.test(source)) {
                const digits = source.replace(/^-/, '')
                if (digits.length > 16 || (digits.length === 16 && digits > '9007199254740991')) {
                    diagnostics.push({ site, keyword: 'numberRange', clause: [], message: 'an integer is between -(2^53 - 1) and 2^53 - 1' })
                }
            }
        })
        return diagnostics
    },
}

/** A number as parsed, with the text it was written as. */
class NumberSource {
    /**
     * @param {number} value
     * @param {string} source
     */
    constructor(value, source) {
        this.value = value
        this.source = source
    }
}

/**
 * Visits every number in JSON text with the text it was written as, which parsing alone loses to rounding.
 * @param {string} text  JSON known to parse
 * @param {(string|number)[]} site
 * @param {(value: number, source: string, site: (string|number)[]) => void} visit
 */
function visitNumberSources(text, site, visit) {
    /** @param {string} key @param {*} value @param {{ source?: string }} context */
    const keepingSource = (key, value, context) =>
        typeof value === 'number' ? new NumberSource(value, context.source ?? String(value)) : value

    /** @param {*} value @param {(string|number)[]} at */
    const walk = (value, at) => {
        if (value instanceof NumberSource) {
            visit(value.value, value.source, at)
        } else if (Array.isArray(value)) {
            value.forEach((each, index) => walk(each, [...at, index]))
        } else if (value !== null && typeof value === 'object') {
            for (const [name, member] of Object.entries(value)) walk(member, [...at, name])
        }
    }

    walk(JSON.parse(text, /** @type {*} */ (keepingSource)), site)
}

/**
 * Checks the candidate against an expectation check-tro checks itself as it reads the candidate.
 * @param {Candidate}   candidate
 * @param {Expectation} expectation
 * @returns {Finding}
 * @throws {Error} if the candidate cannot be read, or check-tro has no check for the expectation.
 */
function checkAsParsed(candidate, expectation) {
    const check = PARSE_CHECKS[expectation.name]
    if (check === undefined) throw new Error(`${expectation.name} is a parse expectation check-tro has no check for`)

    const diagnostics = check(candidate)
    if (diagnostics.length > 0) return { expectation, outcome: EXPECTATION.UNMET, errors: diagnostics }
    return { expectation, outcome: EXPECTATION.MET, errors: [] }
}

/**
 * Checks the candidate against one expectation with the expectation's instrument.
 * @param {Candidate}   candidate
 * @param {Expectation} expectation
 * @returns {Finding}
 * @throws {Error} if the candidate cannot be read, check-tro has no check for a parse expectation, or a validator
 *   makes no determination.
 */
function checkExpectation(candidate, expectation) {
    if (expectation.instrument === 'parse') return checkAsParsed(candidate, expectation)
    return checkAgainstSchema(candidate, expectation)
}

/**
 * Checks the candidate against an expectation stated as a JSON Schema: has every validator make its determination,
 * and reconciles what those finding it invalid reported.
 * @param {Candidate}   candidate
 * @param {Expectation} expectation
 * @returns {Finding}
 * @throws {Error} if a validator makes no determination.
 */
function checkAgainstSchema(candidate, expectation) {
    /** @type {Determination[]} */ const determinedValid = []
    /** @type {Determination[]} */ const determinedInvalid = []
    for (const validator of VALIDATORS) {
        const determination = makeDetermination(validator, expectation, candidate.path)
        if (determination.isValid) {
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
        finding = { expectation, outcome: EXPECTATION.UNMET, errors: reconcileDiagnostics(determinedInvalid) }
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
 * Checks the tiers in order. Above the target, expectations are not claimed. Above a tier that blocks higher tiers and
 * is not met, they are not assessed. Within a tier, an expectation whose required expectation is not met is not assessed.
 * @param {Candidate} candidate
 * @returns {Finding[]}  in tier order, and by name within a tier
 * @throws {Error} if the expectations cannot be listed, one belongs to no tier, their requirements cannot be ordered,
 *   or a validator makes no determination.
 */
function checkCandidateAgainstExpectations(candidate) {
    const tiers = readTierDefinitions()
    const expectationPaths = findExpectationFiles()
    vetTierExpectations(tiers, expectationPaths)
    const expectations = expectationPaths.map((expectationPath) => readExpectation(tiers, expectationPath))

    /** @type {Finding[]} */ const findings = []
    let blockedByLowerTier = false
    for (const tier of tiers) {
        const tierExpectations = inRequiredOrder(
            expectations.filter((expectation) => expectation.tier.number === tier.number), expectations)

        /** @type {Finding[]} */ const tierFindings = []
        for (const expectation of tierExpectations) {
            const requiredNotMet = expectation.requires.some((name) =>
                tierFindings.some((finding) => finding.expectation.name === name && finding.outcome !== EXPECTATION.MET))

            if (tier.number > candidate.targetTier.number) {
                tierFindings.push({ expectation, outcome: EXPECTATION.NOT_CLAIMED, errors: [] })
            } else if (blockedByLowerTier || requiredNotMet) {
                tierFindings.push({ expectation, outcome: EXPECTATION.NOT_ASSESSED, errors: [] })
            } else {
                tierFindings.push(checkExpectation(candidate, expectation))
            }
        }

        if (tier.blocksHigherTiers &&
            tierFindings.some((finding) => finding.outcome === EXPECTATION.UNMET || finding.outcome === EXPECTATION.NOT_ASSESSED)) {
            blockedByLowerTier = true
        }
        findings.push(...tierFindings)
    }

    return findings.sort(byTierThenName)
}

/**
 * A tier is met when every expectation in it and in every lower tier is met, and not met otherwise.
 * @param {Candidate} candidate
 * @param {Finding[]} findings
 * @returns {Assessment[]}  one per tier at or below the target
 */
function assessTiers(candidate, findings) {
    /** @type {Assessment[]} */ const assessments = []
    let lowerTierNotMet = false
    for (const tier of readTierDefinitions().filter((each) => each.number <= candidate.targetTier.number)) {
        const tierFindings = findings.filter((finding) => finding.expectation.tier.number === tier.number)

        if (!lowerTierNotMet && tierFindings.every((finding) => finding.outcome === EXPECTATION.MET)) {
            assessments.push({ tier, outcome: EXPECTATION.MET })
        } else {
            assessments.push({ tier, outcome: EXPECTATION.UNMET })
            lowerTierNotMet = true
        }
    }

    return assessments
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
        (assessment) => `${assessment.tier.number} ${assessment.tier.id} ${assessment.outcome}`)

    return `wrote ${reportPath}; ${verdicts.join(', ')}`
}

const USAGE =
    'usage: check-tro --candidate FILE --report FILE [--target TIER] [--description TEXT] [--compact]'

const ASSUMED_TIER = 'STANDALONE-TRO'

const EXIT = {
    ALL_CLAIMED_TIERS_MET: 0,
    SOME_CLAIMED_TIER_UNMET: 1,
    COULD_NOT_CHECK: 2,
}

/**
 * @param {string} candidatePath
 * @returns {boolean}  whether the path names a file this process can read
 */
function isReadableFile(candidatePath) {
    try {
        fs.accessSync(candidatePath, fs.constants.R_OK)
        return fs.statSync(candidatePath).isFile()
    } catch {
        return false
    }
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
        if (!isReadableFile(candidatePath)) throw new Error(`cannot read the candidate ${candidatePath}`)

        const targetSource = optionValues.target !== undefined ? 'option' : 'default'
        const targetTier = lookUpTier(optionValues.target ?? ASSUMED_TIER)
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

        return assessments.some((assessment) => assessment.outcome !== EXPECTATION.MET)
            ? EXIT.SOME_CLAIMED_TIER_UNMET
            : EXIT.ALL_CLAIMED_TIERS_MET
    } catch (error) {
        process.stderr.write(`check-tro: ${error instanceof Error ? error.message : String(error)}\n`)
        return EXIT.COULD_NOT_CHECK
    }
}

if (require.main === module) process.exitCode = runAsCommand()
