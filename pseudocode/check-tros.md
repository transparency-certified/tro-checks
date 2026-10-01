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

**The program builds a candidate from each entry.**
- It stops if the entry's target is not an object giving a tier, a version, or both.
- It settles the candidate's tier — the one given on the command line, the one its entry names, or `STANDALONE-TRO`.
- It settles the candidate's version — the one given on the command line, the one its entry names, or `trace-spec-2026-04-19`.
- It records where the tier and the version each came from — the command line, the manifest, or the default.
- It records that the description, where the entry gives one, came from the manifest.
- It names the candidate's report after the candidate.

**The program makes the reports directory, if it is not already there.**

**The program reports on each candidate in turn, as in [a run of check-tro](./check-tro.md).**
- It names on the error stream a candidate that could not be checked.
- It goes on to the rest.

**The program answers with an exit status, one of...**
- Successful, when every candidate was reported on.
- Unsuccessful, when any was not.
