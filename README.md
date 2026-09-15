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

The tiers are ordered and cumulative. A
candidate **targets** one tier, named by its ID, and meeting it means meeting
every expectation in that tier and in the tiers below. Expectations in tiers
above the target are reported as *not claimed*.

| Tier | ID | What meeting it means |
| --- | --- | --- |
| 1 | `SAFE-JSON` | JSON that every parser reads the same way |
| 2 | `VALID-JSON-LD` | Valid JSON-LD |
| 3 | `TRACE-JSON-LD` | JSON-LD in the restricted form the TRACE Specification defines for TRO declarations |
| 4 | `STANDALONE-TRO` | A TRO declaration with the structure the Specification requires, whose references resolve within it |
| 5 | `LINKABLE-TRO` | A TRO declaration whose element identifiers cannot collide with another TRO's |

Each expectation is defined by a file in [`exports/`](exports) named for the
expectation, whose suffix says what checks it. A `<name>.parse.json` expectation
is checked by `check-tro` itself as it parses the candidate. A
`<name>.schema.json` expectation is a JSON Schema, put to two widely used JSON
Schema validators, [python-jsonschema](https://github.com/python-jsonschema/jsonschema)
and [Ajv](https://ajv.js.org/), through the wrappers in
[`json-schema-dev`](https://github.com/CIRSS/json-schema-dev); it is not met if
either rejects the candidate. A schema's `validatorFlags` are passed to both
validators with it, as `duplicate-member-names-absent` passes
`--reject-duplicate-members`.

### Tier 1 — SAFE-JSON

JSON that every parser reads the same way.

| Expectation | What it checks |
| --- | --- |
| `utf8-encoded` | The candidate is UTF-8 |
| `json-parses` | The candidate parses as JSON without errors |
| `duplicate-member-names-absent` | No object repeats a member name |
| `lone-surrogates-absent` | No string or member name has an unpaired surrogate |
| `numbers-within-range` | Every number fits a double; every integer is exact |

### Tier 2 — VALID-JSON-LD

Valid JSON-LD.

| Expectation | What it checks |
| --- | --- |
| `context-well-formed` | The root `@context`, if any, has a form JSON-LD allows |
| `graph-well-formed` | The root `@graph`, if any, holds objects, not bare values |
| `ids-and-types-strings` | Every `@id` is a string; every `@type` a string or an array of strings |

### Tier 3 — TRACE-JSON-LD

JSON-LD in the restricted form the TRACE Specification defines for TRO declarations.

| Expectation | What it checks |
| --- | --- |
| `root-context-and-graph-only` | A JSON object with an `@context`, an `@graph`, and nothing else |
| `disallowed-node-keywords-absent` | No keyword outside the `@context` other than `@context`, `@graph`, `@id` and `@type` |
| `disallowed-context-keywords-absent` | No keyword in the `@context` other than `@base` |
| `base-web-scheme` | The `@base`, if any, uses the `https` or `http` scheme |
| `base-simple-url` | The `@base`, if any, is a simple URL: a host, no user info, dot segments, query or fragment, only URL characters, and a final `/` |
| `relative-ids-plain` | Every relative `@id` is a plain path, with no leading `/`, no `.` or `..` segments, and no `?` or `#` |
| `prefix-namespaces-terminated` | Every prefix maps to an absolute IRI ending in `#` or `/` |

### Tier 4 — STANDALONE-TRO

A TRO declaration with the structure the Specification requires, whose references resolve within it.

| Expectation | What it checks |
| --- | --- |
| `trov-terms-known` | Every `trov:` name is one TROV defines |
| `tro-top-level-in-graph` | The TRO is a top-level member of the `@graph` |
| `tro-assembled-by-trs` | The TRO names its assembling system, typed as a TRS |
| `composition-fingerprinted` | The TRO's composition, if any, carries a fingerprint |
| `hashes-well-formed` | The TRO's artifact and fingerprint hashes are well-formed sha256 |

### Tier 5 — LINKABLE-TRO

A TRO declaration whose element identifiers cannot collide with another TRO's.

| Expectation | What it checks |
| --- | --- |
| `base-declared` | The `@context` includes an `@base` |
| `node-ids-present` | Every node carries an explicit `@id` |

## Reports

One report is written per candidate. It gives the candidate and its target,
then the status of each tier and of each expectation — met, not met, not
assessed, or not claimed — and, for each expectation not met, every error found:
what was found, where in the candidate, and why it does not meet the
expectation. Each error is listed once, whichever validator reported it.

Checking stops at the first tier not met: the tiers above it, up to the target,
and their expectations are not assessed. Within a tier, an expectation whose
`requires` names an expectation not met is not assessed.

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
        "target": "STANDALONE-TRO",
        "description": "What this candidate is. Copied into its report."
    }
}
```

`check-tros` checks what the manifest declares: a `.jsonld` file the manifest
does not name is reported as skipped, and an entry naming a file that is not in
the directory stops the run. `make build-reports` in the REPRO writes one report
per candidate to `reports/<name>.md`.

`check-tros` takes each candidate's target tier from the manifest, and assumes
`STANDALONE-TRO` when the manifest names none. `--target` overrides the manifest for
every candidate in the run. The report says where the target came from: the
manifest, the `--target` option, or the default.

## Key files

| File | What it is |
| --- | --- |
| [`exports/*.parse.json`](exports) | The expectations `check-tro` checks as it parses a candidate, each giving its summary and description. |
| [`exports/*.schema.json`](exports) | The expectations checked by JSON Schema, one schema each. |
| [`exports/tiers.json`](exports/tiers.json) | The tiers in order, each with its ID, description, and the expectations that belong to it. An expectation file that no tier lists, a listed expectation with no file, or a tier with no expectations stops every run. |
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

Put a `<name>.schema.json` with a `summary` and a `description` in
[`exports/`](exports), and a `requires` listing any expectations in its tier
that must be met before it is checked. List it in
[`exports/base-manifest`](exports/base-manifest), and assign it to a tier in
[`exports/tiers.json`](exports/tiers.json). Add its row to its tier's table under *What is checked*
above and to [`CAPABILITIES.md`](CAPABILITIES.md), and include a demo in
[`demo/`](demo).
