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
- It settles which tier was meant — the one asked for, or tier 1.
  - It reads the tier definitions the module ships.
  - It stops if no tier answers to that number.
- It notes the name of the file the candidate sits in.
- It records where the tier came from — the `--target` option, or the default.

**The program checks the candidate against each expectation in the target.**
- It finds the expectation files the module ships.
- It stops if a tier lists an expectation that has no file.
- It settles which tier each expectation belongs to.
- It reports an expectation above the candidate's tier as not claimed.
- It has every validator make its determination of the candidate against an expectation at or below the candidate's tier, as in [making a determination](#making-a-determination).
- If every validator determines the candidate valid, it reports the expectation met.
- If every validator determines it invalid, it reports the expectation unmet.
- Otherwise it warns that the validators disagree, and reports the expectation unmet.
- It takes every error any validator reported, once, as in [reconciling the error reports](#reconciling-the-error-reports).

**The program assesses each tier at or below the candidate's.**
- It reports the tier met when every finding in it was met, unmet when any was not.

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

## Reconciling the error reports

**The program takes every error any validator reported, once.**

**The program warns on the diagnostic stream when...**
- Some validator determined valid what another determined invalid.
- The validators reported different errors.

**The program keeps an error's message where every validator that gave one gave the same, and drops it where they disagree.**

## What the report says

**The report names the candidate and describes it.**

**The report states the tier aimed at, and where that tier came from.**

**The report gives the assessment of each tier at or below the one aimed at.**

**The report states every finding, in tier order and alphabetically within a tier, giving...**
- The expectation.
- Its tier.
- Its outcome.
- For those unmet, each error, giving...
  - Where in the candidate.
  - What was found there.
  - What the expectation says about it, in its own words where it has them, and in the terms of the constraint where it does not.
  - Beneath an error that offered alternatives, each alternative tried and the errors that refused it.

**The report names no validator.**

**The report is written without its blank lines when asked for compactly, which suits reading rather than rendering.**
