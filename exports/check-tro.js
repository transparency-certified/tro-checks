#!/usr/bin/env node
//
// Check one candidate against the expectations in its target and write the report.
//
//   check-tro --candidate FILE --report FILE [--target-tier TIER] [--target-version VERSION]
//             [--description TEXT] [--compact]

// @ts-check

const childProcess = require('node:child_process')
const { parseArgs } = require('node:util')
const fs = require('node:fs')
const path = require('node:path')
const { renderReportAsMarkdown, tierLabel } = require('./render-report.js')

/** @typedef {import('./types.js').Tier} Tier */
/** @typedef {import('./types.js').Version} Version */
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

const ASSUMED_TIER = 'STANDALONE-TRO'
const ASSUMED_VERSION = 'trace-2026-04-19'

module.exports = {
    ASSUMED_TIER,
    ASSUMED_VERSION,
    lookUpTier,
    lookUpVersion,
    readVersionDefinitions,
    resolveVersion,
    checkCandidateAgainstExpectations,
    assessTiers,
    statedCreator,
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

const versionsFile = path.join(__dirname, 'versions.json')
const versionsDirectory = path.join(__dirname, 'versions')
const TIERS_FILE_NAME = 'tiers.json'
const ID_BASE = 'https://w3id.org/trace/tro'

/** Keywords an expectation's file may not carry: two the version directories replaced, and one reserved. */
const REFUSED_KEYWORDS = {
    fromVersion: 'a version applies an expectation by listing it in its tiers.json',
    untilVersion: 'a version retires an expectation by leaving it out of its tiers.json',
    refusedFrom: 'it is reserved for deprecations, which are not yet built',
}

/**
 * @param {string} tiersPath
 * @returns {Tier[]}  in order, each numbered by its place from 1
 * @throws {Error} if the tier definitions cannot be read or parsed, or a tier has no id, no description, or no
 *   expectations, or says whether it blocks higher tiers other than by true or false, or an expectation is listed twice.
 */
function readTierDefinitions(tiersPath) {
    /** @type {Omit<Tier, 'number'>[]} */ const definitions = JSON.parse(fs.readFileSync(tiersPath, 'utf8'))

    const tiers = definitions.map((definition, index) => ({ ...definition, number: index + 1 }))

    /** @type {string[]} */ const listed = []
    for (const tier of tiers) {
        if (typeof tier.id !== 'string') throw new Error(`${tiersPath}: tier ${tier.number} has no id`)
        if (typeof tier.description !== 'string') throw new Error(`${tiersPath}: ${tier.id} has no description`)
        if (!Array.isArray(tier.expectations) || tier.expectations.length === 0) {
            throw new Error(`${tiersPath}: ${tier.id} lists no expectations`)
        }
        if (tier.blocksHigherTiers !== undefined && typeof tier.blocksHigherTiers !== 'boolean') {
            throw new Error(`${tiersPath}: ${tier.id} says whether it blocks higher tiers other than by true or false`)
        }
        for (const name of tier.expectations) {
            if (listed.includes(name)) throw new Error(`${tiersPath}: ${name} is listed twice`)
            listed.push(name)
        }
    }

    return tiers
}

/**
 * @param {string}  tierId
 * @param {Version} version  the version whose tiers to look in
 * @returns {Tier}
 * @throws {Error} if the expectations cannot be resolved, or the version has no such tier.
 */
function lookUpTier(tierId, version) {
    const { tiers } = resolveVersion(version)
    const tier = tiers.find((each) => each.id === tierId)

    if (!tier) {
        throw new Error(`no tier ${tierId} under ${version.id}; the tiers are ${tiers.map((each) => each.id).join(', ')}`)
    }

    return tier
}

/**
 * @returns {Version[]}  in order, each numbered by its place from 1
 * @throws {Error} if the version definitions cannot be read or parsed, or a version has no id or no description.
 */
function readVersionDefinitions() {
    /** @type {Omit<Version, 'number'>[]} */ const definitions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'))

    const versions = definitions.map((definition, index) => ({ ...definition, number: index + 1 }))

    for (const version of versions) {
        if (typeof version.id !== 'string') throw new Error(`version ${version.number} has no id`)
        if (typeof version.description !== 'string') throw new Error(`${version.id} has no description`)
        if (typeof version.urlForm !== 'string') throw new Error(`${version.id} has no urlForm`)
    }

    return versions
}

/**
 * @param {string} versionId
 * @returns {Version}
 * @throws {Error} if the version definitions cannot be read, or name no such version.
 */
function lookUpVersion(versionId) {
    const versions = readVersionDefinitions()
    const version = versions.find((each) => each.id === versionId)

    if (!version) {
        throw new Error(`no version ${versionId}; the versions are ${versions.map((each) => each.id).join(', ')}`)
    }

    return version
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
 * @typedef {object} Implementation  the file that implements an expectation under a version
 * @property {string}  path
 * @property {Version} version  the version whose directory holds it
 */
/**
 * @typedef {object} Resolution  what applies under one version
 * @property {Version}       version
 * @property {Tier[]}        tiers         those of the latest tiers.json at or before the version
 * @property {Expectation[]} expectations  those the tiers list, in tier order, each from its latest implementation
 */

/** @type {Map<string, Resolution>} */ const resolutions = new Map()

/**
 * What applies under a version: the latest tiers.json at or before it, and for each expectation that tiers.json lists,
 * the latest implementation at or before it. Every version is resolved and vetted the first time any is asked for.
 * @param {Version} version
 * @returns {Resolution}
 * @throws {Error} if any version's expectations do not resolve; see resolveAllVersions.
 */
function resolveVersion(version) {
    if (resolutions.size === 0) resolveAllVersions()
    const resolution = resolutions.get(version.id)
    if (!resolution) throw new Error(`no version ${version.id}`)
    return resolution
}

/**
 * @param {string} directory
 * @returns {string[]}  the names of the files in it defining expectations, in name order; none if it does not exist
 * @throws {Error} if the directory exists and cannot be listed.
 */
function expectationFileNamesIn(directory) {
    if (!fs.existsSync(directory)) return []
    return fs.readdirSync(directory).filter((name) => instrumentSuffixOf(name) !== undefined).sort()
}

/**
 * Resolves every version in order, each from the versions before it, and keeps each resolution.
 * @throws {Error} if a version has no tiers.json at or before it; a tier lists an expectation with no implementation
 *   at or before the version; a version lists again an expectation an earlier version retired without giving it an
 *   implementation of its own; an implementation in a version's directory is listed in no tier under that version;
 *   an implementation cannot be read or is malformed; or an expectation requires one not listed before it.
 */
function resolveAllVersions() {
    /** @type {Tier[]|undefined} */ let tiers
    /** @type {Map<string, Implementation>} */ const implementations = new Map()
    /** @type {Map<string, Expectation>} */ const readImplementations = new Map()
    /** @type {Set<string>} */ const everListed = new Set()
    /** @type {Set<string>} */ let listedBefore = new Set()

    for (const version of readVersionDefinitions()) {
        const directory = path.join(versionsDirectory, version.id)
        const fileNames = expectationFileNamesIn(directory)
        const introduced = fileNames.map(expectationNameOf)

        for (const fileName of fileNames) {
            implementations.set(expectationNameOf(fileName), { path: path.join(directory, fileName), version })
        }
        const tiersPath = path.join(directory, TIERS_FILE_NAME)
        if (fs.existsSync(tiersPath)) tiers = readTierDefinitions(tiersPath)
        if (!tiers) throw new Error(`no ${TIERS_FILE_NAME} under ${version.id} or any version before it`)

        const listed = tiers.flatMap((tier) => tier.expectations)
        for (const name of listed) {
            if (!implementations.has(name)) {
                throw new Error(`${name} is listed under ${version.id} and has no implementation at or before it`)
            }
            if (everListed.has(name) && !listedBefore.has(name) && !introduced.includes(name)) {
                throw new Error(`${name} is listed again under ${version.id} without an implementation of its own`)
            }
        }
        for (const name of introduced) {
            if (!listed.includes(name)) throw new Error(`${version.id}'s ${name} is listed in no tier under ${version.id}`)
        }

        /** @type {Expectation[]} */ const expectations = []
        for (const tier of tiers) {
            for (const name of tier.expectations) {
                const implementation = /** @type {Implementation} */ (implementations.get(name))
                const key = `${implementation.path} ${tier.id}`
                let expectation = readImplementations.get(key)
                if (!expectation) {
                    expectation = readExpectation(name, tier, implementation)
                    readImplementations.set(key, expectation)
                }
                expectations.push({ ...expectation, tier })
            }
        }
        vetRequires(expectations, version)
        vetSummaries(expectations, readImplementations)

        resolutions.set(version.id, { version, tiers, expectations })
        for (const name of listed) everListed.add(name)
        listedBefore = new Set(listed)
    }
}

/**
 * Reads an expectation from the file implementing it: its name, its instrument, and what the file says it checks.
 * @param {string}         name
 * @param {Tier}           tier
 * @param {Implementation} implementation
 * @returns {Expectation}
 * @throws {Error} if the file cannot be read or parsed, has no summary or description, has a `requires` that is not a
 *   list of names, carries a keyword it may not, or, for a schema, has an `$id` other than its version's URL form gives.
 */
function readExpectation(name, tier, implementation) {
    const fileName = path.basename(implementation.path)
    const where = `${implementation.version.id}'s ${name}`
    const definition = JSON.parse(fs.readFileSync(implementation.path, 'utf8'))

    if (typeof definition.summary !== 'string') throw new Error(`${where} has no summary`)
    if (typeof definition.description !== 'string') throw new Error(`${where} has no description`)

    for (const [keyword, reason] of Object.entries(REFUSED_KEYWORDS)) {
        if (keyword in definition) throw new Error(`${where} carries ${keyword}, which no expectation may: ${reason}`)
    }

    const instrument = INSTRUMENT_OF_SUFFIX[instrumentSuffixOf(fileName) ?? '']
    const expectedId = `${ID_BASE}/${implementation.version.urlForm}/${fileName}`
    if (instrument === 'json-schema' && definition.$id !== expectedId) {
        throw new Error(`${where} has the $id ${JSON.stringify(definition.$id)}, not ${expectedId}`)
    }

    const requires = definition.requires ?? []
    if (!Array.isArray(requires) || requires.some((each) => typeof each !== 'string')) {
        throw new Error(`${where} has a requires that is not a list of expectation names`)
    }

    const validatorFlags = definition.validatorFlags ?? []
    if (!Array.isArray(validatorFlags) || validatorFlags.some((each) => typeof each !== 'string')) {
        throw new Error(`${where} has validatorFlags that are not a list of options`)
    }

    return {
        name,
        instrument,
        definitionPath: implementation.path,
        version: implementation.version,
        tier,
        summary: definition.summary,
        description: definition.description,
        requires,
        validatorFlags,
    }
}

/**
 * Confirms that every expectation under a version requires only expectations listed before it, in its own tier or a
 * lower one, under that version.
 * @param {Expectation[]} expectations  in tier order
 * @param {Version}       version
 * @throws {Error} if an expectation requires one not listed under the version, or listed after it.
 */
function vetRequires(expectations, version) {
    expectations.forEach((expectation, index) => {
        for (const name of expectation.requires) {
            const requiredIndex = expectations.findIndex((each) => each.name === name)
            if (requiredIndex < 0) throw new Error(`${expectation.name} requires ${name}, which is not listed under ${version.id}`)
            if (requiredIndex > index) throw new Error(`${expectation.name} requires ${name}, which is listed after it under ${version.id}`)
        }
    })
}

/**
 * Confirms that every implementation of an expectation read so far gives the same summary, its summary being what
 * keeps its intent the same in every version.
 * @param {Expectation[]}            expectations  those just resolved
 * @param {Map<string, Expectation>} readImplementations  every implementation read so far
 * @throws {Error} if two implementations of one expectation give different summaries.
 */
function vetSummaries(expectations, readImplementations) {
    for (const expectation of expectations) {
        for (const other of readImplementations.values()) {
            if (other.name === expectation.name && other.summary !== expectation.summary) {
                throw new Error(`${expectation.name} has one summary under ${other.version.id} `
                    + `and another under ${expectation.version.id}`)
            }
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
 * What the candidate states it was created with: each tool its TRO's trov:createdWith names, by its schema:name and
 * schema:softwareVersion, following a reference to the node it names, wherever in the document that node is described.
 * A claim of the candidate's, reported as such, and nothing a check relies on.
 * @param {Candidate} candidate
 * @returns {string|undefined}  the tools, separated by commas; undefined where the candidate states none, or cannot be
 *   read as JSON
 */
function statedCreator(candidate) {
    let document
    try {
        document = parsedCandidate(candidate)
    } catch {
        return undefined
    }
    /** @type {*[]} */ const graph = Array.isArray(document?.['@graph']) ? document['@graph'] : []
    const tro = graph.find((node) =>
        /** @type {*[]} */ ([]).concat(node?.['@type'] ?? []).includes('trov:TransparentResearchObject'))
    if (tro === undefined) return undefined

    const isObject = (/** @type {*} */ value) => value !== null && typeof value === 'object' && !Array.isArray(value)
    const isReference = (/** @type {*} */ value) => isObject(value) && Object.keys(value).join() === '@id'

    // Every node described in the document, by its @id: a node is the same node wherever it is described.
    /** @type {Map<string, *>} */ const described = new Map()
    const collect = (/** @type {*} */ value) => {
        if (Array.isArray(value)) {
            value.forEach(collect)
        } else if (isObject(value)) {
            const id = value['@id']
            if (typeof id === 'string' && !isReference(value) && !described.has(id)) described.set(id, value)
            Object.values(value).forEach(collect)
        }
    }
    collect(document)

    const tools = /** @type {*[]} */ ([]).concat(tro['trov:createdWith'] ?? []).map((/** @type {*} */ tool) =>
        isReference(tool) ? described.get(tool['@id']) ?? tool : tool)
    const named = tools.flatMap((tool) => {
        const name = tool?.['schema:name']
        const version = tool?.['schema:softwareVersion']
        if (typeof name !== 'string') return []
        return [typeof version === 'string' ? `${name} ${version}` : name]
    })
    return named.length > 0 ? named.join(', ') : undefined
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
    'unicode-escapes-spell-whole-characters': (candidate) => {
        /** @type {Diagnostic[]} */ const diagnostics = []
        visitParsed(parsedCandidate(candidate), [], (value, site, isMemberName) => {
            if (typeof value === 'string' && UNPAIRED_SURROGATE.test(value)) {
                diagnostics.push({
                    site, keyword: 'surrogate', clause: [], found: value,
                    message: isMemberName
                        ? 'every \\u escape in a member name spells a whole Unicode character'
                        : 'every \\u escape in a string spells a whole Unicode character',
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
 * Checks the tiers in order, as the candidate's target version defines them, each against its expectations. Above the
 * target tier, expectations are not claimed. Above a tier that blocks higher tiers and is not met, they are not
 * assessed. Within a tier, an expectation whose required expectation is not met is not assessed.
 * @param {Candidate} candidate
 * @returns {Finding[]}  in tier order, and within a tier in the order it lists its expectations
 * @throws {Error} if the expectations do not resolve, or a validator makes no determination.
 */
function checkCandidateAgainstExpectations(candidate) {
    const { tiers, expectations } = resolveVersion(candidate.targetVersion)

    /** @type {Finding[]} */ const findings = []
    let blockedByLowerTier = false
    for (const tier of tiers) {
        const tierExpectations = expectations.filter((expectation) => expectation.tier.number === tier.number)

        /** @type {Finding[]} */ const tierFindings = []
        for (const expectation of tierExpectations) {
            const requiredNotMet = expectation.requires.some((name) =>
                [...findings, ...tierFindings].some((finding) => finding.expectation.name === name && finding.outcome !== EXPECTATION.MET))

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

    return findings
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
    const { tiers } = resolveVersion(candidate.targetVersion)
    for (const tier of tiers.filter((each) => each.number <= candidate.targetTier.number)) {
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
    const verdicts = assessments.map((assessment) => `${tierLabel(assessment.tier)} ${assessment.outcome}`)

    return `wrote ${reportPath}; ${verdicts.join(', ')}`
}

const USAGE =
    'usage: check-tro --candidate FILE --report FILE [--target-tier TIER] [--target-version VERSION]'
    + ' [--description TEXT] [--compact]'

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
                'target-tier': { type: 'string' },
                'target-version': { type: 'string' },
                description: { type: 'string' },
                compact: { type: 'boolean' },
            },
            allowPositionals: false,
        }).values

        const candidatePath = optionValues.candidate
        const reportPath = optionValues.report
        if (!candidatePath || !reportPath) throw new Error(USAGE)
        if (!isReadableFile(candidatePath)) throw new Error(`cannot read the candidate ${candidatePath}`)

        const targetTierId = optionValues['target-tier']
        const targetVersionId = optionValues['target-version']
        const candidateDescription = optionValues.description

        const targetVersion = lookUpVersion(targetVersionId ?? ASSUMED_VERSION)

        /** @type {Candidate} */ const candidate = {
            fileName: path.basename(candidatePath),
            path: candidatePath,
            description: candidateDescription,
            descriptionSource: candidateDescription !== undefined ? 'option' : undefined,
            targetTier: lookUpTier(targetTierId ?? ASSUMED_TIER, targetVersion),
            targetVersion,
            targetTierSource: targetTierId !== undefined ? 'option' : 'default',
            targetVersionSource: targetVersionId !== undefined ? 'option' : 'default',
        }
        candidate.createdWith = statedCreator(candidate)

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
