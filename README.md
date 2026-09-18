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

<!-- generated: tier-summary -->

<table>
<thead>
<tr><th align="left">Tier</th><th align="left">ID</th><th align="left">What meeting it means</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>SAFE&#8209;JSON</td><td>JSON that every supported parser reads the same way</td></tr>
<tr><td>2</td><td>SAFE&#8209;JSON&#8209;LD</td><td>JSON-LD that every supported processor reads the same way</td></tr>
<tr><td>3</td><td>TRACE&#8209;JSON&#8209;LD</td><td>JSON-LD in the restricted form the TRACE Specification requires for TRO declarations</td></tr>
<tr><td>4</td><td>STANDALONE&#8209;TRO</td><td>A TRO declaration with the structure the TRACE Specification requires, whose references resolve within it</td></tr>
<tr><td>5</td><td>LINKABLE&#8209;TRO</td><td>A TRO declaration whose element identifiers cannot collide with another TRO's</td></tr>
</tbody>
</table>

<!-- end: tier-summary -->

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

### Supported parsers and processors

`SAFE-JSON` and `SAFE-JSON-LD` promise that a candidate reads the same way in
every *supported* implementation which includes the following:

| | Implementation | Version |
| --- | --- | --- |
| JSON parser | Python `json` (via `jsonschema-validate`) | 3.10 |
| JSON parser | Node.js `JSON.parse` (via `ajv-validate` and `check-tro`) | 22 |
| JSON-LD processor | [jsonld.js](https://github.com/digitalbazaar/jsonld.js) | 8.3.3 |
| JSON-LD processor | [PyLD](https://github.com/digitalbazaar/pyld) | 3.3.0 |
| JSON-LD processor | [rdflib](https://github.com/RDFLib/rdflib) | 7.6.0 |

### The expectations in each tier

Every tier and its expectations, in the order they are checked. This table is generated
from [`exports/tiers.json`](exports/tiers.json) and the expectation files themselves by
`make update-readme`; edit those rather than the rows below.

<!-- generated: tier-expectations -->

<table>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;1&nbsp;—&nbsp;SAFE&#8209;JSON</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><code>utf8-encoded</code></td><td>The candidate is UTF-8</td></tr>
<tr><td nowrap><code>json-parses</code></td><td>The candidate parses as JSON without errors</td></tr>
<tr><td nowrap><code>duplicate-member-names-absent</code></td><td>No object repeats a member name</td></tr>
<tr><td nowrap><code>lone-surrogates-absent</code></td><td>No string or member name has an unpaired surrogate</td></tr>
<tr><td nowrap><code>numbers-within-range</code></td><td>Every number fits a double; every integer is exact</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;2&nbsp;—&nbsp;SAFE&#8209;JSON&#8209;LD</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><code>context-well-formed</code></td><td>The root <code>@context</code>, if any, has a form JSON-LD allows</td></tr>
<tr><td nowrap><code>graph-well-formed</code></td><td>The root <code>@graph</code>, if any, holds objects, not bare values</td></tr>
<tr><td nowrap><code>ids-and-types-strings</code></td><td>Every <code>@id</code> is a string; every <code>@type</code> a string or an array of strings</td></tr>
<tr><td nowrap><code>context-at-root-only</code></td><td>The document's only <code>@context</code> is the one at its root: no node below it and no term definition within it carries another</td></tr>
<tr><td nowrap><code>containers-absent</code></td><td>No <code>@container</code> in a term definition</td></tr>
<tr><td nowrap><code>vocab-absent</code></td><td>No <code>@vocab</code> in a context</td></tr>
<tr><td nowrap><code>context-protection-absent</code></td><td>No <code>@protected</code>, <code>@propagate</code> or <code>@import</code> in a context</td></tr>
<tr><td nowrap><code>id-coercion-absent</code></td><td>No <code>"@type": "@id"</code> in a term definition</td></tr>
<tr><td nowrap><code>graph-at-root-only</code></td><td><code>@graph</code> appears only at the root</td></tr>
<tr><td nowrap><code>id-segments-portable</code></td><td>Every segment of a relative <code>@id</code> is a portable name: letters, digits, dots, hyphens and underscores, beginning and ending with a letter or digit</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;3&nbsp;—&nbsp;TRACE&#8209;JSON&#8209;LD</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><code>root-context-and-graph-only</code></td><td>A JSON object with an <code>@context</code>, an <code>@graph</code>, and nothing else</td></tr>
<tr><td nowrap><code>disallowed-node-keywords-absent</code></td><td>No keyword outside the <code>@context</code> other than <code>@context</code>, <code>@graph</code>, <code>@id</code> and <code>@type</code></td></tr>
<tr><td nowrap><code>disallowed-context-keywords-absent</code></td><td>No member of an <code>@context</code> is a keyword other than <code>@base</code>; what a term definition holds is not a member of the <code>@context</code></td></tr>
<tr><td nowrap><code>base-web-scheme</code></td><td>The <code>@base</code>, if any, uses the <code>https</code> or <code>http</code> scheme</td></tr>
<tr><td nowrap><code>base-simple-url</code></td><td>The <code>@base</code>, if any, is a simple URL: a host, no user info, dot segments, query or fragment, only URL characters, and a final <code>/</code></td></tr>
<tr><td nowrap><code>prefix-namespaces-terminated</code></td><td>Every prefix maps to an absolute IRI ending in <code>#</code> or <code>/</code></td></tr>
<tr><td nowrap><code>context-local</code></td><td>The <code>@context</code> is inline: no string names a remote context</td></tr>
<tr><td nowrap><code>context-aliases-absent</code></td><td>No term definition aliases a property; a term definition holds only a <code>@type</code> naming a datatype</td></tr>
<tr><td nowrap><code>types-prefixed-or-absolute</code></td><td>Every <code>@type</code> value is a prefixed or absolute IRI, never a bare name</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;4&nbsp;—&nbsp;STANDALONE&#8209;TRO</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><code>core-prefixes-pinned</code></td><td><code>trov</code> is declared and is the only prefix for a TROV namespace; <code>rdf</code>, <code>rdfs</code> and <code>schema</code> prefixes, if declared, are the standard ones</td></tr>
<tr><td nowrap><code>trov-terms-known</code></td><td>Every <code>trov:</code> name is one TROV defines</td></tr>
<tr><td nowrap><code>tro-top-level-in-graph</code></td><td>The TRO is a top-level member of the <code>@graph</code></td></tr>
<tr><td nowrap><code>tro-assembled-by-trs</code></td><td>The TRO names its assembling system, typed as a TRS</td></tr>
<tr><td nowrap><code>trov-version-known</code></td><td>The TRO declares, in <code>trov:vocabularyVersion</code>, a TROV version this checker knows: <code>0.1</code></td></tr>
<tr><td nowrap><code>composition-has-fingerprint</code></td><td>The TRO's composition, if any, carries one fingerprint, which carries one hash</td></tr>
<tr><td nowrap><code>composition-identifies-artifacts</code></td><td>The TRO's composition, if any, names at least one artifact in a <code>trov:hasArtifact</code> array</td></tr>
<tr><td nowrap><code>artifact-hashes-present</code></td><td>Every artifact in the composition carries a <code>trov:hash</code>, one hash or an array of at least one</td></tr>
<tr><td nowrap><code>hash-algorithms-permitted</code></td><td>Every hash names an algorithm TRACE permits: a collision-resistant digest from the SHA-2, SHA-3 or BLAKE families</td></tr>
<tr><td nowrap><code>hash-values-lowercase-hex</code></td><td>Every hash carries its value as a string of lowercase hexadecimal digits</td></tr>
<tr><td nowrap><code>hash-values-correct-length</code></td><td>Every hash value has the length its algorithm produces</td></tr>
<tr><td nowrap><code>mime-types-two-part</code></td><td>Every artifact's <code>trov:mimeType</code> is a string of the form <code>type/subtype</code></td></tr>
<tr><td nowrap><code>times-iso-8601</code></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> is an ISO 8601 date-time; every <code>schema:dateCreated</code> an ISO 8601 date or date-time</td></tr>
<tr><td nowrap><code>times-zoned</code></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> carries its time zone</td></tr>
<tr><td nowrap><code>tro-name-description-text</code></td><td>The TRO's <code>schema:name</code> and <code>schema:description</code>, if present, are Text: a string or an array of strings</td></tr>
<tr><td nowrap><code>creators-person-or-organization</code></td><td>The TRO's <code>schema:creator</code>, if present, is a node typed <code>schema:Person</code> or <code>schema:Organization</code>, never a string</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;5&nbsp;—&nbsp;LINKABLE&#8209;TRO</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><code>base-declared</code></td><td>The <code>@context</code> includes an <code>@base</code></td></tr>
<tr><td nowrap><code>base-has-path</code></td><td>The <code>@base</code> names something below the host, not the host alone</td></tr>
<tr><td nowrap><code>base-host-lowercase</code></td><td>The <code>@base</code> host is lowercase</td></tr>
<tr><td nowrap><code>base-host-ownable</code></td><td>The <code>@base</code> host is a domain name the minter could hold, not a reserved or documentation name</td></tr>
<tr><td nowrap><code>node-ids-present</code></td><td>Every node carries an explicit <code>@id</code></td></tr>
<tr><td nowrap><code>blank-node-ids-absent</code></td><td>No <code>@id</code> is a blank node identifier</td></tr>
</tbody>
</table>

<!-- end: tier-expectations -->

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
| [`exports/render-readme.js`](exports/render-readme.js) | Writes this README's account of what is checked from the tiers and the expectations themselves. Run by `make update-readme`. |
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
[`exports/tiers.json`](exports/tiers.json). Then run `make update-readme`, which
writes its row into the table under *What is checked* above from the `summary`
you gave it. Add it to [`CAPABILITIES.md`](CAPABILITIES.md), and include a demo
in [`demo/`](demo).

The `summary` is the row. Write it as plain prose with no line breaks of your
own: the table is HTML, and the reader's browser breaks it to the width it has.
