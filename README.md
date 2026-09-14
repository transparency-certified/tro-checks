# tro-checks

Checks a TRO declaration against the requirements of the
[TRACE Specification](https://transparency-certified.github.io/trace-specification/)
and reports which it meets. It serves a **producer** checking what its Trusted
Research System emits, and a **consumer** deciding whether to rely on a TRO
someone else produced.

The TRO under examination is the **candidate**. Each requirement it is checked
against is an **expectation**, and the expectations are grouped into **tiers**.
See [`GLOSSARY.md`](GLOSSARY.md) for these and the other terms used here.

## What is checked

The tiers are ordered and cumulative. A candidate **targets** one tier, and
meeting it means meeting every expectation in that tier and in the tiers below.
Expectations in tiers above the target are reported as *not claimed*.

| Tier | What meeting it means |
| --- | --- |
| 0 — Well-Formed | Valid JSON-LD conforming to the profile TRACE tooling expects |
| 1 — Self-Contained | References within the TRO resolve; its identifiers need not be unique outside it |
| 2 — Linkable-Data | Element identifiers cannot collide with another TRO's; TRO elements can be published |

| Tier | Expectation | What it checks |
| --- | --- | --- |
| 0 | `context-well-formed` | The root `@context`, if any, has a form JSON-LD allows |
| 0 | `graph-well-formed` | The root `@graph`, if any, holds objects, not bare values |
| 0 | `document-rooted-in-nodes` | The document is an object or an array of objects |
| 0 | `disallowed-node-keywords-absent` | No keyword outside the `@context` other than `@context`, `@graph`, `@id` and `@type` |
| 0 | `disallowed-context-keywords-absent` | No keyword in the `@context` other than `@base` |
| 0 | `ids-and-types-strings` | Every `@id` is a string; every `@type` a string or an array of strings |
| 1 | `context-and-graph-present` | A JSON object with an `@context` and an `@graph` |
| 1 | `tro-top-level-in-graph` | The TRO is a top-level member of the `@graph` |
| 1 | `tro-assembled-by-trs` | The TRO names its assembling system, typed as a TRS |
| 1 | `composition-fingerprinted` | The TRO's composition, if any, carries a fingerprint |
| 1 | `hashes-well-formed` | The TRO's artifact and fingerprint hashes are well-formed sha256 |
| 1 | `trov-terms-known` | Every `trov:` name is one TROV defines |
| 2 | `base-declared` | The `@context` includes an `@base` |
| 2 | `node-ids-present` | Every node carries an explicit `@id` |

Each expectation is a JSON Schema in [`exports/`](exports), named for the
expectation. Every expectation is put to two widely used JSON Schema validators,
[python-jsonschema](https://github.com/python-jsonschema/jsonschema) and
[Ajv](https://ajv.js.org/), through the wrappers in
[`json-schema-dev`](https://github.com/CIRSS/json-schema-dev). An expectation is
not met if either rejects the candidate.

## Reports

One report is written per candidate. It gives the candidate and its target,
then the status of each tier and of each expectation — met, not met, or not
claimed — and, for each expectation not met, every error found: what was found,
where in the candidate, and why it does not meet the expectation. Each error is
listed once, whichever validator reported it.

[`spec-tro-checks`](https://github.com/transparency-certified/spec-tro-checks/tree/main/reports)
has example reports, including one with an expectation not met.

## Usage

The tools are distributed for now as a capability module for a
[REPRO](https://github.com/repros-dev/repro), a Docker-based reproducible
environment. Checking particular TROs means declaring them as candidates in a
REPRO that requires this module and supplies the candidates;
[`spec-tro-checks`](https://github.com/transparency-certified/spec-tro-checks)
is a worked example of such a repository.

A consuming REPRO requires the module in its Dockerfile:

```
ENV TRACE 'https://raw.githubusercontent.com/transparency-certified/${1}/${2}/exports'

RUN repro.require tro-checks main ${TRACE} --report
```

This installs `check-tro` and `check-tros`, and hooks the check-and-report
workflow to the REPRO's `build-reports` target.

The candidates are `.jsonld` files in the REPRO's `candidates/` directory, each
declared in `candidates/manifest.json` under a key naming its file, so the key
`spec-example-2026-04-08` declares `candidates/spec-example-2026-04-08.jsonld`:

```json
{
    "spec-example-2026-04-08": {
        "target": 1,
        "description": "What this candidate is. Copied into its report."
    }
}
```

`check-tros` checks what the manifest declares: a `.jsonld` file the manifest
does not name is reported as skipped, and an entry naming a file that is not in
the directory stops the run. `make build-reports` in the REPRO writes one report
per candidate to `reports/<name>.md`.

`check-tros` takes each candidate's target tier from the manifest, and assumes
tier 1 when the manifest names none. `--target` overrides the manifest for
every candidate in the run. The report says where the target came from: the
manifest, the `--target` option, or the default.

## Key files

| File | What it is |
| --- | --- |
| [`exports/*.schema.json`](exports) | The expectations, one JSON Schema each. |
| [`exports/tiers.json`](exports/tiers.json) | Each tier's name and description, and which expectations belong to it. An expectation file that no tier lists, or a listed expectation with no file, stops every run. |
| [`exports/check-tro.js`](exports/check-tro.js) | The checker. Applies the expectations in a candidate's target and writes the report. Installed as `check-tro`. |
| [`exports/check-tros.js`](exports/check-tros.js) | Runs the checker over the candidates the manifest names, each at its own target, writing `reports/<name>.md` for each. Installed as `check-tros`. |
| [`pseudocode/`](pseudocode) | What the checker does, in outline. |
| [`GLOSSARY.md`](GLOSSARY.md) | The key entities the tools in this repository concern. |
| [`models/`](models/README.md) | How the key entities fit together, each subject modeled in more than one paradigm. |
| [`CAPABILITIES.md`](CAPABILITIES.md) | The JSON Schema capabilities the expectations use, each with its demo in [`json-schema-demos`](https://github.com/CIRSS/json-schema-demos). |
| [`REVIEWS.md`](REVIEWS.md) | Who has reviewed each file, at what level of detail. |
| [`demo/`](demo) | Demos of checking particular expectations. |

## Building the Docker image

In the top-level directory of a clone of this repository:

```
make build-parent      # once, on a fresh clone
make build-image
```

`make test-code` checks the checker's JavaScript against the type annotations
in its comments, with the configuration in `jsconfig.json` that the editor also
reads. A field renamed in one file and not in another fails there.

## Adding an expectation

Put a `<name>.schema.json` with a `summary` in [`exports/`](exports), list it in
[`exports/base-manifest`](exports/base-manifest), and assign it to a tier in
[`exports/tiers.json`](exports/tiers.json). Add its row to *What is checked*
above, and include a demo in [`demo/`](demo).
