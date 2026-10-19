#!/usr/bin/env node
//
// Run at the top of a repository clone, copies tro-checks' GitHub Actions workflows into its
// .github/ directory, along with the actions and scripts each one uses. workflow-catalog.json,
// beside this program, lists those files for each workflow.
//
//   install-github-workflows list                    lists the workflows tro-checks provides
//   install-github-workflows install WORKFLOW...     copies the workflows named
//   install-github-workflows update                  copies the installed ones again

// @ts-check

const fs = require('node:fs')
const path = require('node:path')
const { parseArgs } = require('node:util')

const MODULE_NAME = 'tro-checks'
const TRO_CHECKS_INSTALLATION = __dirname
const WORKFLOW_CATALOG_FILE = 'workflow-catalog.json'
const GITHUB_DIRECTORY = '.github'

/** @typedef {Object<string, Workflow>} WorkflowCatalog  keyed by workflow name */
/**
 * @typedef {object} Workflow
 * @property {string} file
 * @property {string[]} uses
 */

/**
 * @returns {WorkflowCatalog}
 */
function readWorkflowCatalog() {
    return JSON.parse(fs.readFileSync(path.join(TRO_CHECKS_INSTALLATION, WORKFLOW_CATALOG_FILE), 'utf8'))
}

/**
 * @param {WorkflowCatalog} workflowCatalog
 * @param {string[]} workflowNames
 * @returns {Set<string>}  paths in tro-checks: each workflow's file, and each file the workflows use
 */
function determineFilesToCopy(workflowCatalog, workflowNames) {
    /** @type {Set<string>} */ const filesToCopy = new Set()
    for (const name of workflowNames) {
        const workflow = workflowCatalog[name]
        filesToCopy.add(workflow.file)
        for (const file of workflow.uses) {
            filesToCopy.add(file)
        }
    }
    return filesToCopy
}

/**
 * @param {string} file  a path in tro-checks
 * @returns {string}  where the file goes in the clone
 */
function pathInCloneFor(file) {
    /** @type {Object<string, string>} */
    const DIRECTORY_IN_CLONE = { gha: '.github', versions: '.github/versions' }
    const directoryInTroChecks = file.split('/')[0]
    const pathBelowDirectory = path.relative(directoryInTroChecks, file)
    return path.join(DIRECTORY_IN_CLONE[directoryInTroChecks], pathBelowDirectory)
}

/**
 * @param {WorkflowCatalog} workflowCatalog
 * @returns {string[]}  the names of the workflows whose workflow file is in the clone
 */
function findInstalledWorkflows(workflowCatalog) {
    /** @param {string} name */
    function isInstalled(name) {
        return fs.existsSync(pathInCloneFor(workflowCatalog[name].file))
    }

    const installedWorkflows = Object.keys(workflowCatalog).filter(isInstalled)
    return installedWorkflows
}

/**
 * @param {WorkflowCatalog} workflowCatalog
 * @param {string[]} workflowNames
 * @throws {Error} if a workflow name is not one of the catalog's workflows.
 */
function checkWorkflowNamesAreInCatalog(workflowCatalog, workflowNames) {
    const workflowsInCatalog = Object.keys(workflowCatalog)
    const workflowsNotInCatalog = workflowNames.filter((name) => !workflowsInCatalog.includes(name))
    if (workflowsNotInCatalog.length > 0) {
        throw new Error(`no workflow ${workflowsNotInCatalog.join(', ')}; the workflows are ${workflowsInCatalog.join(', ')}`)
    }
}

/**
 * @param {string} source
 * @param {string} target
 */
function copyFileKeepingMode(source, target) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(source, target)
    fs.chmodSync(target, fs.statSync(source).mode)
}

/**
 * @param {WorkflowCatalog} workflowCatalog
 * @param {string[]} workflowNames
 * @returns {string[]}  the files written, in the clone
 * @throws {Error} if a workflow name is not one of the catalog's workflows, or a file cannot be read or written.
 */
function copyWorkflowFiles(workflowCatalog, workflowNames) {
    checkWorkflowNamesAreInCatalog(workflowCatalog, workflowNames)

    const filesToCopy = determineFilesToCopy(workflowCatalog, workflowNames)

    /** @type {string[]} */ const filesWritten = []
    for (const file of filesToCopy) {
        const copiedTo = pathInCloneFor(file)
        copyFileKeepingMode(path.join(TRO_CHECKS_INSTALLATION, file), copiedTo)
        filesWritten.push(copiedTo)
    }
    return filesWritten
}

/**
 * @param {string} troChecksVersion
 * @returns {string}  the file written, in the clone
 */
function recordTroChecksVersion(troChecksVersion) {
    const versionFile = path.join(GITHUB_DIRECTORY, 'tro-checks-version')
    fs.mkdirSync(GITHUB_DIRECTORY, { recursive: true })
    fs.writeFileSync(versionFile, `${troChecksVersion}\n`)
    return versionFile
}

/**
 * @returns {string}  the version of tro-checks the image was built with
 * @throws {Error} if TRO_CHECKS_VERSION is not set.
 */
function readTroChecksVersion() {
    const troChecksVersion = process.env.TRO_CHECKS_VERSION
    if (!troChecksVersion) throw new Error('TRO_CHECKS_VERSION is not set')
    return troChecksVersion
}

/**
 * @throws {Error} if the current directory is not the top of a repository clone.
 */
function checkAtTopOfClone() {
    if (!fs.existsSync('.git')) {
        throw new Error('the current directory is not the top of a repository clone (it has no .git)')
    }
}

/**
 * @param {WorkflowCatalog} workflowCatalog
 * @param {string[]} workflowNames
 */
function installWorkflowsAndRecordVersion(workflowCatalog, workflowNames) {
    const troChecksVersion = readTroChecksVersion()

    const filesWritten = copyWorkflowFiles(workflowCatalog, workflowNames)
    filesWritten.push(recordTroChecksVersion(troChecksVersion))

    for (const file of filesWritten) {
        process.stdout.write(`Installed ${file}\n`)
    }
}

function runListCommand() {
    checkAtTopOfClone()
    const workflowCatalog = readWorkflowCatalog()

    const workflowsProvided = Object.keys(workflowCatalog)
    const installedWorkflows = findInstalledWorkflows(workflowCatalog)

    let longestNameLength = 0
    for (const name of workflowsProvided) {
        longestNameLength = Math.max(longestNameLength, name.length)
    }

    process.stdout.write(`${MODULE_NAME} provides these workflows:\n`)
    for (const name of workflowsProvided) {
        let status = 'not installed'
        if (installedWorkflows.includes(name)) {
            status = 'installed'
        }
        process.stdout.write(`  ${name.padEnd(longestNameLength)}   ${status}\n`)
    }
}

/** @param {string[]} workflowNames */
function runInstallCommand(workflowNames) {
    checkAtTopOfClone()
    const workflowCatalog = readWorkflowCatalog()
    installWorkflowsAndRecordVersion(workflowCatalog, workflowNames)
}

function runUpdateCommand() {
    checkAtTopOfClone()
    const workflowCatalog = readWorkflowCatalog()

    const installedWorkflows = findInstalledWorkflows(workflowCatalog)
    if (installedWorkflows.length === 0) {
        process.stdout.write(`no workflow ${MODULE_NAME} provides is installed\n`)
        return
    }
    installWorkflowsAndRecordVersion(workflowCatalog, installedWorkflows)
}

const EXIT = {
    DONE: 0,
    COULD_NOT_INSTALL: 2,
}

/** @returns {number}  the exit status */
function runAsCommand() {
    try {
        const commandLineWords = parseArgs({
            args: process.argv.slice(2),
            options: {},
            allowPositionals: true,
        }).positionals

        const command = commandLineWords[0]
        const workflowNamesGiven = commandLineWords.slice(1)

        if (command === 'list') {
            if (workflowNamesGiven.length > 0) {
                process.stderr.write(`install-github-workflows: list takes no workflow names, so ignored ${workflowNamesGiven.join(', ')}\n`)
            }
            runListCommand()
        } else if (command === 'install') {
            if (workflowNamesGiven.length === 0) {
                throw new Error('install was given no workflow names; list names the workflows tro-checks provides')
            }
            runInstallCommand(workflowNamesGiven)
        } else if (command === 'update') {
            if (workflowNamesGiven.length > 0) {
                throw new Error(`update takes no workflow names, but was given ${workflowNamesGiven.join(', ')}; it updates the installed workflows`)
            }
            runUpdateCommand()
        } else if (command === undefined) {
            throw new Error('no command given; the commands are list, install and update')
        } else {
            throw new Error(`no command ${command}; the commands are list, install and update`)
        }

        return EXIT.DONE
    } catch (error) {
        process.stderr.write(`install-github-workflows: ${error instanceof Error ? error.message : String(error)}\n`)
        return EXIT.COULD_NOT_INSTALL
    }
}

process.exitCode = runAsCommand()
