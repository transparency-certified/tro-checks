# What happens during a run of check-tro

**The program accepts from the command line...**
- The location of the candidate.
- The location to write the report.
- The tier the candidate is expected to reach.
- The version of the Specification it is expected to reach that tier under.
- A description of the candidate.
- Whether to write the report without its blank lines.

**The program describes its own usage and stops if...**
- The location of the candidate was not given.
- The location to write the report was not given.

**The program builds a representation of the candidate.**
- It settles which version was meant — the one asked for, or `trace-spec-2026-04-19`.
  - It reads the version definitions the module ships, numbering the versions in their order.
  - It stops if a version has no ID or no description.
  - It stops if no version answers to that ID.
- It settles what applies under each version, as in [resolving the versions](#resolving-the-versions).
- It settles which tier was meant — the one asked for, or `STANDALONE-TRO` — among the tiers of that version.
  - It stops if no tier of that version answers to that ID.
- It stops if the candidate is not a file it can read.
- It notes the name of the file the candidate sits in.
- It records where the tier came from — the `--target-tier` option, or the default.
- It records where the version came from — the `--target-version` option, or the default.
- It records that the description, where one was given, came from the `--description` option.

**The program checks the candidate against each expectation in the target.**
- It goes through the tiers of the candidate's version in order, and through each tier's expectations in the order the tier lists them.
- It reports an expectation above the candidate's tier as not claimed.
- It reports an expectation as not assessed when a lower tier that blocks higher tiers is not met, or an expectation it requires is not met.
- It checks a parse expectation at or below the candidate's tier itself, reading and parsing the candidate once for all of them: that its bytes are UTF-8, that its text is JSON, that no string or member name has an unpaired surrogate, and that every number is within range.
- It has every validator make its determination of the candidate against a JSON Schema expectation at or below the candidate's tier, as in [making a determination](#making-a-determination).
- If every validator determines the candidate valid, it reports the expectation met.
- If every validator determines it invalid, it reports the expectation unmet.
- Otherwise it warns that the validators disagree, and reports the expectation unmet.
- It takes every error any validator reported, once, as in [reconciling the diagnostics](#reconciling-the-diagnostics).

**The program assesses each tier at or below the candidate's.**
- It reports the tier met when every finding in it and in every lower tier was met, and unmet otherwise.

**The program writes the report, as in [what the report says](#what-the-report-says).**

**The program says in one line what it wrote, giving...**
- The location of the report.
- Each tier's assessment.

**The program answers with an exit status, one of...**
- Every claimed tier met.
- Some claimed tier unmet.
- Could not check.

## Resolving the versions

**The program goes through the versions in order, each carrying forward what the versions before it defined.**
- It takes the tiers from the version's own tier definitions, where its directory has them, and otherwise from the latest version before it that has them.
- It stops if no version so far has tier definitions.
- It stops if a tier has no ID, no description, or no expectations, says whether it blocks higher tiers other than by true or false, or lists an expectation twice.
- It takes each expectation the tiers list from the file in the version's own directory, where there is one, and otherwise from the latest version before it that has one.
- It stops if a listed expectation has no file at or before the version.
- It stops if the version lists an expectation an earlier version retired, by leaving it out of its tiers, without giving it a file of its own.
- It stops if the version's directory holds a file for an expectation its tiers do not list.
- It stops if a file has no summary or no description, carries `fromVersion`, `untilVersion` or `refusedFrom`, or, for a schema, has an `$id` other than its directory gives.
- It stops if an expectation requires one its version does not list, or lists after it.
- It stops if two files for one expectation give different summaries.

## Making a determination

**The program runs the validator on the expectation and the candidate, asking for its report as JSON.**

**The validator determines...**
- Valid, when it exits with nothing to report.
- Invalid, when it exits reporting an error.

**The validator makes no determination if...**
- It cannot be started.
- It is killed by a signal.
- It exits any other way.
- It writes nothing the program can read as a report.

**The program keeps the report the validator wrote.**

**The program stops the run when the validator made no determination, saying...**
- Which validator refused.
- What it wrote.

## Reconciling the diagnostics

**The program takes every error any validator reported, once.**

**The program warns on the standard error stream when...**
- Some validator determined valid what another determined invalid.
- The validators reported different errors.

**The program keeps each message, at every level of an error, where every validator that gave one there gave the same, and drops it where they disagree.**

## What the report says

**The report opens in prose.**
- It names the candidate in its title.
- It says what the report is and what wrote it.
- It gives the candidate's description.
- It says which tier the candidate is expected to satisfy, at which version.
- It says that the candidate meets every expectation in that tier and the tiers below, or how many expectations it does not meet and in which tiers, and how many were not assessed.
- It says what the sections below contain.

**The report writes a tier the same way everywhere, as its number and its ID, and sets every tier and version as an identifier.**

**The report links an identifier to the first place below that details it.**
- It links each tier named in the opening, and in the list of tiers, to that tier's list of expectations.
- It links each expectation not met, in its tier's list, to the details of that expectation.
- It leaves the links out when asked for compactly.

**The report names the candidate, describes it, and states the version aimed at and the tier aimed at under it, saying beside the description, the version and the tier where each came from.**

**The report lists every tier, giving the tier, the commitment it describes, and its status — met or not met for each tier at or below the one aimed at, and not claimed for each above it.**

**The report lists every expectation that applies under the version, under its tier, in the order the tier lists them, giving what it checks in a few words and its status, and closes each tier's list with the tier's status.**

**The report details each expectation not met, giving what it checks in a sentence, the version whose definition of it was used, and each error it found...**
- What was found there, if anything.
- Where in the candidate.
- Why the expectation is not met, in its own words where it has them, and in the terms of the constraint where it does not.

**The report names no validator.**

**The report breaks long prose in its tables into short lines, so that IDs, names and statuses stay on one line when rendered.**

**The report is written without its blank lines, and without those breaks, when asked for compactly, which suits reading rather than rendering.**
