# Glossary

The key entities the tools in this repository concern.

**Candidate** — a TRO declaration put forward for evaluation

**Producer** — the organization whose TRS (Trusted Research System) emitted a Candidate

**Consumer** — an organization that must decide whether to rely on a Candidate

**Expectation** — a condition a Candidate is expected to satisfy, verified by performing one or more Checks

**Check** — one test performed in verifying an Expectation, failing with its own kind of Error

**Specification** — the TRACE documentation representing the source of Expectations

**Tier** — an ordered subset of the Expectations; meeting a Tier means meeting it along with every Tier below

**Target** — the Tier a Candidate is expected by a Producer or Consumer to satisfy, along with every Tier below

**Validator** — a tool that determines whether an Expectation is met by a particular Candidate

**Determination** — what one Validator determined about one Candidate against one Expectation: valid or invalid, and its report

**Error** — one failure of a Check

**Diagnostic** — one Validator's report of an Error including where in the Candidate, what was found there, and which clause of the Expectation it failed

**Attempt** — one way a Check could have been passed that a Validator tried and that did not work

**Finding** — what checking one Expectation against a Candidate established

**Assessment** — a determination of whether a Candidate meets the Expectations in a Tier

**Report** — a document stating the Assessments and Findings about one Candidate with respect to a Target


