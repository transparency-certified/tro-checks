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
<tr><td>4</td><td>USES&#8209;TROV&#8209;CORRECTLY</td><td>JSON-LD whose TROV terms, and the schema.org terms TROV specifies, are used as they are defined</td></tr>
<tr><td>5</td><td>DEFINES&#8209;TRS</td><td>JSON-LD that defines a Trusted Research System, identified by an absolute IRI</td></tr>
<tr><td>6</td><td>STANDALONE&#8209;TRO</td><td>A TRO declaration with the structure the TRACE Specification requires, whose references resolve within it</td></tr>
<tr><td>7</td><td>LINKABLE&#8209;TRO</td><td>A TRO declaration whose element identifiers cannot collide with another TRO's</td></tr>
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
<tr><td nowrap><samp>utf8-encoded</samp></td><td>The candidate is UTF-8</td></tr>
<tr><td nowrap><samp>json-parses</samp></td><td>The candidate parses as JSON without errors</td></tr>
<tr><td nowrap><samp>duplicate-member-names-absent</samp></td><td>No object repeats a member name</td></tr>
<tr><td nowrap><samp>lone-surrogates-absent</samp></td><td>No string or member name has an unpaired surrogate</td></tr>
<tr><td nowrap><samp>numbers-within-range</samp></td><td>Every number fits a double; every integer is exact</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;2&nbsp;—&nbsp;SAFE&#8209;JSON&#8209;LD</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>context-well-formed</samp></td><td>The root <code>@context</code>, if any, has a form JSON-LD allows</td></tr>
<tr><td nowrap><samp>graph-well-formed</samp></td><td>The root <code>@graph</code>, if any, holds objects, not bare values</td></tr>
<tr><td nowrap><samp>ids-and-types-strings</samp></td><td>Every <code>@id</code> is a string; every <code>@type</code> a string or an array of strings</td></tr>
<tr><td nowrap><samp>context-at-root-only</samp></td><td>The document's only <code>@context</code> is the one at its root: no node below it and no term definition within it carries another</td></tr>
<tr><td nowrap><samp>containers-absent</samp></td><td>No <code>@container</code> in a term definition</td></tr>
<tr><td nowrap><samp>vocab-absent</samp></td><td>No <code>@vocab</code> in a context</td></tr>
<tr><td nowrap><samp>context-protection-absent</samp></td><td>No <code>@protected</code>, <code>@propagate</code> or <code>@import</code> in a context</td></tr>
<tr><td nowrap><samp>id-coercion-absent</samp></td><td>No <code>"@type": "@id"</code> in a term definition</td></tr>
<tr><td nowrap><samp>graph-at-root-only</samp></td><td><code>@graph</code> appears only at the root</td></tr>
<tr><td nowrap><samp>id-segments-portable</samp></td><td>Every segment of a relative <code>@id</code> is a portable name: letters, digits, dots, hyphens and underscores, beginning and ending with a letter or digit</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;3&nbsp;—&nbsp;TRACE&#8209;JSON&#8209;LD</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>root-context-and-graph-only</samp></td><td>A JSON object with an <code>@context</code>, an <code>@graph</code>, and nothing else</td></tr>
<tr><td nowrap><samp>disallowed-node-keywords-absent</samp></td><td>No keyword outside the <code>@context</code> other than <code>@context</code>, <code>@graph</code>, <code>@id</code> and <code>@type</code></td></tr>
<tr><td nowrap><samp>disallowed-context-keywords-absent</samp></td><td>No member of an <code>@context</code> is a keyword other than <code>@base</code>; what a term definition holds is not a member of the <code>@context</code></td></tr>
<tr><td nowrap><samp>base-web-scheme</samp></td><td>The <code>@base</code>, if any, uses the <code>https</code> or <code>http</code> scheme</td></tr>
<tr><td nowrap><samp>base-simple-url</samp></td><td>The <code>@base</code>, if any, is a simple URL: a host, no user info, dot segments, query or fragment, only URL characters, and a final <code>/</code></td></tr>
<tr><td nowrap><samp>prefix-namespaces-terminated</samp></td><td>Every prefix maps to an absolute IRI ending in <code>#</code> or <code>/</code></td></tr>
<tr><td nowrap><samp>context-local</samp></td><td>The <code>@context</code> is inline: no string names a remote context</td></tr>
<tr><td nowrap><samp>context-aliases-absent</samp></td><td>No term definition aliases a property; a term definition holds only a <code>@type</code> naming a datatype</td></tr>
<tr><td nowrap><samp>types-prefixed-or-absolute</samp></td><td>Every <code>@type</code> value is a prefixed or absolute IRI, never a bare name</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;4&nbsp;—&nbsp;USES&#8209;TROV&#8209;CORRECTLY</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>core-prefixes-pinned</samp></td><td><code>trov</code> is declared and is the only prefix for a TROV namespace; <code>rdf</code>, <code>rdfs</code> and <code>schema</code> prefixes, if declared, are the standard ones</td></tr>
<tr><td nowrap><samp>trov-terms-known</samp></td><td>Every <code>trov:</code> name is one TROV defines</td></tr>
<tr><td nowrap><samp>trov-version-known</samp></td><td>The TRO declares, in <code>trov:vocabularyVersion</code>, a released version of TROV</td></tr>
<tr><td nowrap><samp>hash-algorithms-permitted</samp></td><td>Every hash names an algorithm TRACE permits: a collision-resistant digest from the SHA-2, SHA-3 or BLAKE families</td></tr>
<tr><td nowrap><samp>hash-values-correct-form</samp></td><td>Every hash value is lowercase hexadecimal of the length its algorithm produces</td></tr>
<tr><td nowrap><samp>mime-types-two-part</samp></td><td>Every artifact's <code>trov:mimeType</code> is a string of the form <code>type/subtype</code></td></tr>
<tr><td nowrap><samp>times-iso-8601</samp></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> is an ISO 8601 date-time; every <code>schema:dateCreated</code> an ISO 8601 date or date-time</td></tr>
<tr><td nowrap><samp>times-zoned</samp></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> carries its time zone</td></tr>
<tr><td nowrap><samp>tro-name-description-text</samp></td><td>The TRO's <code>schema:name</code> and <code>schema:description</code>, if present, are Text: a string or an array of strings</td></tr>
<tr><td nowrap><samp>creators-person-or-organization</samp></td><td>The TRO's <code>schema:creator</code>, if present, is a node typed <code>schema:Person</code> or <code>schema:Organization</code>, never a string</td></tr>
<tr><td nowrap><samp>trov-capabilities-predefined</samp></td><td>A capability's <code>trov:</code> type is one TROV predefines</td></tr>
<tr><td nowrap><samp>trov-performance-attributes-predefined</samp></td><td>A performance attribute's <code>trov:</code> type is one TROV predefines</td></tr>
<tr><td nowrap><samp>trov-tro-attributes-predefined</samp></td><td>A TRO attribute's <code>trov:</code> type is one TROV predefines</td></tr>
<tr><td nowrap><samp>custom-terms-not-trov</samp></td><td>Every <code>trov:customTerm</code> entry declares a term outside the TROV namespace</td></tr>
<tr><td nowrap><samp>custom-term-superclasses-extensible</samp></td><td>Every custom term extends <code>trov:TRSCapabilityType</code> or <code>trov:TRPAttributeType</code></td></tr>
<tr><td nowrap><samp>trov-signing-mechanisms-predefined</samp></td><td>A signing mechanism is identified by reference, and a <code>trov:</code> one is one TROV predefines</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;5&nbsp;—&nbsp;DEFINES&#8209;TRS</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>trs-defined</samp></td><td>A TRS is defined, with an <code>@id</code>, at the top of the <code>@graph</code> or as the object of <code>trov:wasAssembledBy</code>, and nowhere else</td></tr>
<tr><td nowrap><samp>trs-id-absolute</samp></td><td>The TRS is identified by an absolute IRI, or a compact IRI outside the <code>trov</code> namespace</td></tr>
<tr><td nowrap><samp>capability-ids-absolute</samp></td><td>Every capability is identified by an absolute IRI, or a compact IRI outside the <code>trov</code> namespace</td></tr>
<tr><td nowrap><samp>capability-warrants-absolute</samp></td><td>Every performance attribute refers to the capability warranting it by absolute IRI</td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;6&nbsp;—&nbsp;STANDALONE&#8209;TRO</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>tro-top-level-in-graph</samp></td><td>The TRO is a top-level member of the <code>@graph</code></td></tr>
<tr><td nowrap><samp>tro-assembled-by-trs</samp></td><td>The TRO names its assembling system, typed as a TRS</td></tr>
<tr><td nowrap><samp>composition-has-fingerprint</samp></td><td>The TRO's composition, if any, carries one fingerprint, which carries one hash</td></tr>
<tr><td nowrap><samp>composition-identifies-artifacts</samp></td><td>The TRO's composition, if any, names at least one artifact in a <code>trov:hasArtifact</code> array</td></tr>
<tr><td nowrap><samp>artifact-hashes-present</samp></td><td>Every artifact in the composition carries a <code>trov:hash</code>, one hash or an array of at least one</td></tr>
<tr><td nowrap><samp>gpg-signing-key-present</samp></td><td>A TRO signed with <code>trov:GPGSigning</code> gives its TRS a <code>trov:publicKey</code></td></tr>
</tbody>
<tbody>
<tr><th colspan="2" align="left"><br>Tier&nbsp;7&nbsp;—&nbsp;LINKABLE&#8209;TRO</th></tr>
<tr><th align="left">Expectation</th><th align="left">What it checks</th></tr>
<tr><td nowrap><samp>base-declared</samp></td><td>The <code>@context</code> includes an <code>@base</code></td></tr>
<tr><td nowrap><samp>base-has-path</samp></td><td>The <code>@base</code> names something below the host, not the host alone</td></tr>
<tr><td nowrap><samp>base-host-lowercase</samp></td><td>The <code>@base</code> host is lowercase</td></tr>
<tr><td nowrap><samp>base-host-ownable</samp></td><td>The <code>@base</code> host is a domain name the minter could hold, not a reserved or documentation name</td></tr>
<tr><td nowrap><samp>node-ids-present</samp></td><td>Every node carries an explicit <code>@id</code></td></tr>
<tr><td nowrap><samp>blank-node-ids-absent</samp></td><td>No <code>@id</code> is a blank node identifier</td></tr>
</tbody>
</table>

<!-- end: tier-expectations -->

## Reports

One report is written per candidate. It gives the candidate and its target,
then the status of each tier and of each expectation, and, for each
expectation not met, every error found: what was found, where in the
candidate, and why it does not meet the expectation. Each error is listed
once, whichever validator reported it.

A tier up to the target is met when every expectation in it and in every tier
below it is met, and not met otherwise; a tier above the target is not claimed.

An expectation in a claimed tier is met, not met, or not assessed. It is not
assessed when `SAFE-JSON`, `SAFE-JSON-LD` or `TRACE-JSON-LD` below it is not
met, or when an expectation its `requires` names is not met. Above those three
tiers, every claimed tier's expectations are checked whatever the tiers below
them came to.

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
| [`exports/tiers.json`](exports/tiers.json) | The tiers in order, each with its ID, description, the expectations that belong to it, and `blocksHigherTiers` where no tier above it is assessed until it is met. An expectation file that no tier lists, a listed expectation with no file, or a tier with no expectations stops every run. |
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
[`exports/`](exports), and a `requires` listing any expectations that must be
met before it is checked. List it in
[`exports/base-manifest`](exports/base-manifest), and add it to a tier in
[`exports/tiers.json`](exports/tiers.json), after every expectation it requires:
expectations are checked and reported in the order the tiers list them. Then run `make update-readme`, which
writes its row into the table under *What is checked* above from the `summary`
you gave it. Add it to [`CAPABILITIES.md`](CAPABILITIES.md), and include a demo
in [`demo/`](demo).

The `summary` is the row. Write it as plain prose with no line breaks of your
own: the table is HTML, and the reader's browser breaks it to the width it has.
