// Run install-github-workflows against a dummy clone, and check what arrives.

// @ts-check

const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const TRO_CHECKS_INSTALLATION = path.join(__dirname, '..', 'exports')
const INSTALLER_PROGRAM = path.join(TRO_CHECKS_INSTALLATION, 'install-github-workflows.js')
const WORKFLOW_CATALOG_FILE = path.join(TRO_CHECKS_INSTALLATION, 'workflow-catalog.json')

/** @returns {string}  a new directory standing for the top of a repository clone, holding only .git */
function makeDummyClone() {
    const topOfClone = fs.mkdtempSync(path.join(os.tmpdir(), 'dummy-clone-'))
    fs.mkdirSync(path.join(topOfClone, '.git'))
    return topOfClone
}

/**
 * @typedef {object} ProgramRun
 * @property {number|null} exitStatus
 * @property {string} output
 * @property {string} errors
 */

/**
 * @param {string[]} commandLineWords
 * @param {string} currentDirectory
 * @returns {ProgramRun}
 */
function runInstaller(commandLineWords, currentDirectory) {
    const environment = Object.assign({}, process.env, { TRO_CHECKS_VERSION: 'main' })
    return runInstallerWithEnvironment(commandLineWords, currentDirectory, environment)
}

/**
 * @param {string[]} commandLineWords
 * @param {string} currentDirectory
 * @param {NodeJS.ProcessEnv} environment
 * @returns {ProgramRun}
 */
function runInstallerWithEnvironment(commandLineWords, currentDirectory, environment) {
    const result = childProcess.spawnSync('node', [INSTALLER_PROGRAM].concat(commandLineWords), {
        cwd: currentDirectory,
        env: environment,
        encoding: 'utf8',
    })
    return { exitStatus: result.status, output: result.stdout, errors: result.stderr }
}

/** @returns {string[]}  the names of the workflows the catalog describes */
function readWorkflowNamesFromCatalog() {
    const workflowCatalog = JSON.parse(fs.readFileSync(WORKFLOW_CATALOG_FILE, 'utf8'))
    return Object.keys(workflowCatalog)
}

/**
 * @param {string} topOfClone
 * @returns {string[]}  every file under the clone's .github/, relative to the top of the clone
 */
function findFilesUnderGithub(topOfClone) {
    const githubDirectory = path.join(topOfClone, '.github')
    if (!fs.existsSync(githubDirectory)) {
        return []
    }

    /** @param {string} pathUnderGithub */
    function isFile(pathUnderGithub) {
        return fs.statSync(path.join(githubDirectory, pathUnderGithub)).isFile()
    }

    const files = fs
        .readdirSync(githubDirectory, { recursive: true, encoding: 'utf8' })
        .filter(isFile)
        .map((pathUnderGithub) => path.join('.github', pathUnderGithub))
        .sort()
    return files
}

/**
 * The files an installed file refers to, in the forms the workflows, actions and scripts use:
 * ./.github/actions/NAME and .github/scripts/NAME in a workflow or action, and $(dirname "$0")/NAME,
 * $(dirname "$0")/../versions/ and $(dirname "$0")/../tro-checks-version in a script.
 *
 * @param {string} installedFile  relative to the top of the clone
 * @param {string} topOfClone
 * @returns {string[]}  each a file, relative to the top of the clone, or a directory ending in /
 */
function findReferencesIn(installedFile, topOfClone) {
    const text = fs.readFileSync(path.join(topOfClone, installedFile), 'utf8')

    /** @type {string[]} */ const references = []
    for (const match of text.matchAll(/\.\/\.github\/actions\/([\w-]+)/g)) {
        references.push(`.github/actions/${match[1]}/action.yml`)
    }
    for (const match of text.matchAll(/(?<!\.\/)\.github\/scripts\/([\w-]+)/g)) {
        references.push(`.github/scripts/${match[1]}`)
    }
    for (const match of text.matchAll(/\$\(dirname "\$0"\)\/([\w-]+|\.\.\/[\w-]+)/g)) {
        const target = match[1]
        if (target === '../versions') {
            references.push('.github/versions/')
        } else if (target.startsWith('../')) {
            references.push(path.join('.github', target.slice('../'.length)))
        } else {
            references.push(`.github/scripts/${target}`)
        }
    }
    return references
}

/**
 * @param {string} reference  a file, or a directory ending in /
 * @param {string[]} installedFiles
 * @returns {boolean}
 */
function isInstalled(reference, installedFiles) {
    const referenceIsDirectory = reference.endsWith('/')
    if (referenceIsDirectory) {
        return installedFiles.some((file) => file.startsWith(reference))
    }
    return installedFiles.includes(reference)
}

describe('install-github-workflows install', function () {

    for (const name of readWorkflowNamesFromCatalog()) {
        it(`installs everything ${name} refers to, when installed alone`, function () {
            const clone = makeDummyClone()
            const run = runInstaller(['install', name], clone)
            assert.equal(run.exitStatus, 0, run.errors)

            const installedFiles = findFilesUnderGithub(clone)
            /** @type {string[]} */ const missingReferences = []
            for (const file of installedFiles) {
                for (const reference of findReferencesIn(file, clone)) {
                    if (!isInstalled(reference, installedFiles)) {
                        missingReferences.push(`${file} refers to ${reference}`)
                    }
                }
            }

            assert.deepEqual(missingReferences, [])
        })
    }

    it('installs only the workflows named', function () {
        const clone = makeDummyClone()
        runInstaller(['install', 'preview-pasted-declaration'], clone)

        const installedWorkflowFiles = findFilesUnderGithub(clone)
            .filter((file) => file.startsWith('.github/workflows/'))
        assert.deepEqual(installedWorkflowFiles, ['.github/workflows/preview-pasted-declaration.yml'])
    })

    for (const name of ['preview-pasted-declaration', 'preview-one-candidate']) {
        it(`installs the tiers of every TRACE version tro-checks has, for ${name}`, function () {
            const clone = makeDummyClone()
            runInstaller(['install', name], clone)

            /** @param {string} versionName */
            function hasTiers(versionName) {
                return fs.existsSync(path.join(TRO_CHECKS_INSTALLATION, 'versions', versionName, 'tiers.json'))
            }

            const expectedTiersFiles = fs
                .readdirSync(path.join(TRO_CHECKS_INSTALLATION, 'versions'))
                .filter(hasTiers)
                .map((versionName) => path.join('.github', 'versions', versionName, 'tiers.json'))
                .sort()
            const installedTiersFiles = findFilesUnderGithub(clone)
                .filter((file) => file.startsWith('.github/versions/'))

            assert.ok(expectedTiersFiles.length >= 2)
            assert.deepEqual(installedTiersFiles, expectedTiersFiles)
        })
    }

    it('keeps the scripts executable', function () {
        const clone = makeDummyClone()
        runInstaller(['install', 'regenerate-reports'], clone)

        const executableBits = 0o111
        const originalScript = path.join(TRO_CHECKS_INSTALLATION, 'gha', 'scripts', 'candidates-changed')
        const installedScript = path.join(clone, '.github', 'scripts', 'candidates-changed')
        assert.equal(fs.statSync(installedScript).mode & executableBits, fs.statSync(originalScript).mode & executableBits)
    })

    it('says each file it installed and records the version of tro-checks', function () {
        const clone = makeDummyClone()
        const run = runInstaller(['install', 'regenerate-reports'], clone)

        assert.match(run.output, /^Installed \.github\/workflows\/regenerate-reports\.yml$/m)
        assert.match(run.output, /^Installed \.github\/tro-checks-version$/m)
        assert.equal(fs.readFileSync(path.join(clone, '.github', 'tro-checks-version'), 'utf8'), 'main\n')
    })

    it('stops when the version of tro-checks is not known, and installs nothing', function () {
        const clone = makeDummyClone()
        const environment = Object.assign({}, process.env)
        delete environment.TRO_CHECKS_VERSION
        const run = runInstallerWithEnvironment(['install', 'regenerate-reports'], clone, environment)

        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /TRO_CHECKS_VERSION is not set/)
        assert.deepEqual(findFilesUnderGithub(clone), [])
    })

    it('refuses a workflow tro-checks does not provide, naming the ones it does, and installs nothing', function () {
        const clone = makeDummyClone()
        const run = runInstaller(['install', 'regenerate-everything'], clone)

        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /no workflow regenerate-everything; the workflows are preview-pasted-declaration, /)
        assert.deepEqual(findFilesUnderGithub(clone), [])
    })

    it('refuses a mix of workflows tro-checks does and does not provide, and installs nothing', function () {
        const clone = makeDummyClone()
        const run = runInstaller(['install', 'preview-one-candidate', 'regenerate-everything'], clone)

        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /no workflow regenerate-everything;/)
        assert.deepEqual(findFilesUnderGithub(clone), [])
    })

    it('stops when given no workflow names', function () {
        const run = runInstaller(['install'], makeDummyClone())
        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /install was given no workflow names/)
    })
})

describe('install-github-workflows update', function () {

    it('updates the installed workflows, and only those', function () {
        const clone = makeDummyClone()
        runInstaller(['install', 'regenerate-reports', 'preview-one-candidate'], clone)

        const run = runInstaller(['update'], clone)
        assert.equal(run.exitStatus, 0, run.errors)
        assert.match(run.output, /^Installed \.github\/workflows\/regenerate-reports\.yml$/m)
        assert.match(run.output, /^Installed \.github\/workflows\/preview-one-candidate\.yml$/m)
        assert.doesNotMatch(run.output, /pull-candidates/)
    })

    it('replaces a copy that was changed in the clone with tro-checks\' file', function () {
        const clone = makeDummyClone()
        runInstaller(['install', 'regenerate-reports'], clone)

        const installedScript = path.join(clone, '.github', 'scripts', 'candidates-changed')
        fs.writeFileSync(installedScript, '# changed in the clone\n')

        const run = runInstaller(['update'], clone)
        assert.equal(run.exitStatus, 0, run.errors)

        const originalScript = path.join(TRO_CHECKS_INSTALLATION, 'gha', 'scripts', 'candidates-changed')
        assert.equal(fs.readFileSync(installedScript, 'utf8'), fs.readFileSync(originalScript, 'utf8'))
    })

    it('says so when no workflow is installed', function () {
        const run = runInstaller(['update'], makeDummyClone())
        assert.equal(run.exitStatus, 0)
        assert.match(run.output, /no workflow tro-checks provides is installed/)
    })

    it('stops when given workflow names', function () {
        const run = runInstaller(['update', 'regenerate-reports'], makeDummyClone())
        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /update takes no workflow names, but was given regenerate-reports/)
    })
})

describe('install-github-workflows list', function () {

    it('lists the workflows, saying which are installed', function () {
        const clone = makeDummyClone()
        runInstaller(['install', 'regenerate-reports'], clone)

        const run = runInstaller(['list'], clone)
        assert.equal(run.exitStatus, 0)
        assert.match(run.output, /^  regenerate-reports +installed$/m)
        assert.match(run.output, /^  pull-candidates +not installed$/m)
    })

    it('warns that it ignores workflow names, and still lists', function () {
        const run = runInstaller(['list', 'regenerate-reports'], makeDummyClone())
        assert.equal(run.exitStatus, 0)
        assert.match(run.errors, /list takes no workflow names, so ignored regenerate-reports/)
        assert.match(run.output, /tro-checks provides these workflows:/)
    })
})

describe('install-github-workflows, run anywhere but the top of a clone', function () {

    for (const command of ['list', 'install regenerate-reports', 'update']) {
        it(`stops for ${command}, writing nothing`, function () {
            const notAClone = fs.mkdtempSync(path.join(os.tmpdir(), 'not-a-clone-'))
            const run = runInstaller(command.split(' '), notAClone)

            assert.equal(run.exitStatus, 2)
            assert.match(run.errors, /the current directory is not the top of a repository clone/)
            assert.deepEqual(fs.readdirSync(notAClone), [])
        })
    }
})

describe('install-github-workflows, given no command it knows', function () {

    it('stops when no command is given', function () {
        const run = runInstaller([], makeDummyClone())
        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /no command given; the commands are list, install and update/)
    })

    it('stops when the command is not one it knows', function () {
        const run = runInstaller(['instal'], makeDummyClone())
        assert.equal(run.exitStatus, 2)
        assert.match(run.errors, /no command instal; the commands are list, install and update/)
    })
})

describe('the workflow catalog', function () {

    it('describes every workflow tro-checks provides', function () {
        const workflowsProvided = fs
            .readdirSync(path.join(TRO_CHECKS_INSTALLATION, 'gha', 'workflows'))
            .map((file) => path.basename(file, '.yml'))
            .sort()
        assert.deepEqual(readWorkflowNamesFromCatalog().sort(), workflowsProvided)
    })
})
