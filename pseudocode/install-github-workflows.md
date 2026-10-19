# What happens during a run of install-github-workflows

**The program accepts from the command line...**
- Whether to list tro-checks' workflows, install workflows, or update the installed ones.
- For an install, the names of the workflows to install.

**The program says what is wrong and stops if...**
- No command was given.
- The command given is not list, install or update.
- A workflow was named for an update.
- No workflow was named for an install.
- For any command, the current directory is not the top of a repository clone.

**The program reads tro-checks' workflow catalog.**
- It reads `workflow-catalog.json`, beside the program: for each of tro-checks' workflows, its workflow file and the files it uses.

**For a list, the program names tro-checks' workflows, says which are in the clone's `.github/`, and stops.**
- It warns that any workflow names given are ignored.

**For an install, the program determines the workflows to install.**
- It stops if a workflow named is not one of tro-checks'.

**For an update, the program determines the workflows to update.**
- It takes each of tro-checks' workflows whose workflow file is in the clone's `.github/`.
- It says so, and updates none, if none is.

**The program takes the version of tro-checks the image was built with from `TRO_CHECKS_VERSION`, and stops if it is not set.**

**The program installs those workflows.**
- It gathers each workflow's file, and the files it uses; a file several workflows use is gathered once.
- It copies each file into the clone's `.github/`, keeping the file's mode: what is under tro-checks' `gha/` goes under `.github/`, and what is under `versions/` goes under `.github/versions/`.

**The program records the version of tro-checks in `.github/tro-checks-version`.**

**The program names each file it wrote.**

**The program answers with an exit status, one of...**
- Successful, when every file was written.
- Unsuccessful, when the command was missing or wrong, workflows were named for an update or not named for an install, the current directory is not the top of a clone, the version of tro-checks is not known, a workflow named is not one of tro-checks', or a file could not be read or written.
