# What happens during a run of check-tro

**The program accepts from the command line...**
- The location of the candidate.
- The location to write the report.
- The tier the candidate is expected to reach.
- A description of the candidate.
- Whether to write the report without its blank lines.

**The program describes its own usage and stops if...**
- The location of the candidate was not given.
- The location to write the report was not given.

**The program builds a representation of the candidate.**
- It settles which tier was meant — the one asked for, or `STANDALONE-TRO`.
  - It reads the tier definitions the module ships, numbering the tiers in their order.
  - It stops if a tier has no ID, no description, or no expectations.
  - It stops if no tier answers to that ID.
- It notes the name of the file the candidate sits in.
- It records where the tier came from — the `--target` option, or the default.

**The program checks the candidate against each expectation in the target.**
- It finds the expectation files the module ships.
- It stops if a tier lists an expectation that has no file.
- It settles which tier each expectation belongs to.
- It stops if an expectation requires one outside its tier, or the requirements within a tier form a cycle.
- It goes through the tiers in order, and through each tier's expectations with each after those it requires.
- It reports an expectation above the candidate's tier as not claimed.
- It reports an expectation as not assessed when a lower tier is not met, or an expectation it requires is not met.
- It checks a parse expectation at or below the candidate's tier itself, reading and parsing the candidate once for all of them: that its bytes are UTF-8, that its text is JSON, that no string or member name has an unpaired surrogate, and that every number is within range.
- It has every validator make its determination of the candidate against a JSON Schema expectation at or below the candidate's tier, as in [making a determination](#making-a-determination).
- If every validator determines the candidate valid, it reports the expectation met.
- If every validator determines it invalid, it reports the expectation unmet.
- Otherwise it warns that the validators disagree, and reports the expectation unmet.
- It takes every error any validator reported, once, as in [reconciling the diagnostics](#reconciling-the-diagnostics).

**The program assesses each tier at or below the candidate's.**
- It reports the tier met when every finding in it was met, unmet when any was not, and not assessed when a lower tier is not met.

**The program writes the report, as in [what the report says](#what-the-report-says).**

**The program says in one line what it wrote, giving...**
- The location of the report.
- Each tier's assessment.

**The program answers with an exit status, one of...**
- Every claimed tier met.
- Some claimed tier unmet.
- Could not check.

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

**The report names the candidate, describes it, and states the tier aimed at and where that tier came from.**

**The report lists every tier, giving its number and ID, the commitment it describes, and its status — met, not met, or not assessed for each tier at or below the one aimed at, and not claimed for each above it.**

**The report lists every expectation, in tier order and alphabetically within a tier, giving its tier, what it checks in a few words, and its status.**

**The report details each expectation not met, giving what it checks in a sentence and each error it found...**
- What was found there, if anything.
- Where in the candidate.
- Why the expectation is not met, in its own words where it has them, and in the terms of the constraint where it does not.

**The report names no validator.**

**The report is written without its blank lines when asked for compactly, which suits reading rather than rendering.**
