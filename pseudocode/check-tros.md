# What happens during a run of check-tros

**The program accepts from the command line...**
- The directory of candidates.
- The directory to write reports into.
- The tier to check every candidate against.
- The version of the Specification to check every candidate under.

**The program describes its own usage and stops if...**
- The directory of candidates was not given.
- The directory to write reports into was not given.

**The program gathers the candidates.**
- It reads the candidates manifest in the candidates directory.
  - It stops if there is no candidates directory.
  - It stops if there is no manifest.
  - It stops if the manifest names no candidates.
- It takes each of the manifest's entries to name a candidate.
  - It stops if an entry names a file that is not in the directory.
- It says which `.jsonld` files in the directory the manifest does not name.

**The program builds a candidate from each entry, once for each target the entry gives.**
- It takes an entry that gives no target to have one, with neither a tier nor a version.
- It stops if the entry's target is not an object giving a tier, a version, or both, or a list of such objects.
- It settles the target's tier — the one given on the command line, the one the entry names, or `STANDALONE-TRO`.
- It settles the target's version — the one given on the command line, the one the entry names, or `trace-spec-2026-04-19`.
- It records where the tier and the version each came from — the command line, the manifest, or the default.
- It records that the description, where the entry gives one, came from the manifest.
- It stops if the entry gives a title that is not a string.
- It stops if the entry lists the same target twice.
- It keeps one of the targets that a tier or version given on the command line has made the same.
- It names the report after the candidate, the target's version, and the number of the target's tier.

**The program makes the reports directory, if it is not already there.**

**The program reports on each candidate against each of its targets in turn, as in [a run of check-tro](./check-tro.md).**
- It names on the error stream a candidate that could not be checked against a target.
- It goes on to the rest.

**The program writes a summary of the reports into the reports directory.**
- It lists the reports under each candidate, with the candidate's description.
- It says in one sentence every target the candidate is expected to satisfy, version by version, and under each version from the lowest tier up.
- It heads a candidate with the title its entry gives and names its file beneath, or heads it with its name where the entry gives no title.
- It gives each report's target, whether the target's tier was met, and a link to the report.
- It says which reports in the directory this run did not write.

**The program answers with an exit status, one of...**
- Successful, when every report was written.
- Unsuccessful, when any was not.
