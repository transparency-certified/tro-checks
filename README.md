# tro-checks

The `tro-checks` toolkit checks a TRO declaration against the requirements of the
[TRACE Specification](https://transparency-certified.github.io/trace-specification/)
and reports which it meets. The toolkit is meant for two kinds of user: a **producer**
checking what its Trusted Research System emits, and a **consumer** deciding whether to
rely on a TRO someone else produced.

The TRO under examination is the **candidate**. Each requirement it is checked
against is an **expectation**, and the expectations are grouped into **tiers**.
See [`GLOSSARY.md`](GLOSSARY.md) for these and the other terms used here.

## What is checked

The tiers are ordered and cumulative. A
candidate **targets** one tier, named by its ID, and meeting it means meeting
every expectation in that tier and in the tiers below. Expectations in tiers
above the target tier are reported as *not claimed*.

<!-- generated: tier-summary -->

<table>
<thead>
<tr><th align="left">Tier</th><th align="left">What meeting it means</th></tr>
</thead>
<tbody>
<tr><td><samp>Tier&nbsp;1&nbsp;&#8209;&nbsp;SAFE&#8209;JSON</samp></td><td>JSON that every supported parser reads the same way</td></tr>
<tr><td><samp>Tier&nbsp;2&nbsp;&#8209;&nbsp;SAFE&#8209;JSON&#8209;LD</samp></td><td>JSON-LD that uses only those constructs our supported JSON-LD processors handle consistently, and whose interpretation depends on nothing outside the file</td></tr>
<tr><td><samp>Tier&nbsp;3&nbsp;&#8209;&nbsp;TRACE&#8209;PERMISSIBLE&#8209;JSON&#8209;LD</samp></td><td>JSON-LD that avoids constructs and practices TRACE disallows</td></tr>
<tr><td><samp>Tier&nbsp;4&nbsp;&#8209;&nbsp;USES&#8209;TROV&#8209;CORRECTLY</samp></td><td>JSON-LD that uses TROV terms only in ways TRACE allows</td></tr>
<tr><td><samp>Tier&nbsp;5&nbsp;&#8209;&nbsp;DEFINES&#8209;TRS</samp></td><td>JSON-LD that defines a Trusted Research System, identified by an absolute IRI</td></tr>
<tr><td><samp>Tier&nbsp;6&nbsp;&#8209;&nbsp;STANDALONE&#8209;TRO</samp></td><td>A TRO declaration with the structure the TRACE Specification requires, whose references resolve within it</td></tr>
<tr><td><samp>Tier&nbsp;7&nbsp;&#8209;&nbsp;LINKABLE&#8209;TRO</samp></td><td>A TRO declaration whose element identifiers cannot collide with those in another TRO</td></tr>
</tbody>
</table>

<!-- end: tier-summary -->

### Specification versions

A candidate targets its tier under one **version** of the TRACE Specification: a release, or
a pre-release of one. The versions are ordered, and each version's directory under
[`exports/versions/`](exports/versions) holds what that version adds or changes: the
expectations it introduces or redefines, and its tiers where they change. Everything else
carries forward from the versions before it. A version applies the expectations its tiers
list; one it leaves out is not checked and is not listed in the report. An expectation
keeps its name and its summary in every version, while what it checks in detail may
differ. A candidate can be checked under a version that has not yet been released.

<!-- generated: version-summary -->

<table>
<thead>
<tr><th align="left">Version</th><th align="left">What it is</th></tr>
</thead>
<tbody>
<tr><td><samp>trace&#8209;2026&#8209;04&#8209;19</samp></td><td>The first release of the TRACE Specification, tagged trace-spec-2026-04-19</td></tr>
<tr><td><samp>trace&#8209;0.1</samp></td><td>TRACE Specification 0.1, not yet released</td></tr>
</tbody>
</table>

<!-- end: version-summary -->

### The expectations in each tier

The table below lists every tier and its expectations under the latest version, in the
order they are checked, and the versions each expectation applies under and is redefined
in. The tiers above are also the latest version's. This table is generated from
[`exports/versions/`](exports/versions) by `make update-readme`; edit the files there
rather than the rows below.

<!-- generated: tier-expectations -->

<table>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;1&nbsp;&#8209;&nbsp;SAFE&#8209;JSON</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>utf8-encoded</samp></td><td>The candidate is UTF-8</td><td>all</td></tr>
<tr><td nowrap><samp>json-parses</samp></td><td>The candidate parses as JSON without errors</td><td>all</td></tr>
<tr><td nowrap><samp>unicode-escapes-spell-whole-characters</samp></td><td>Every <code>\u</code> escape spells a whole Unicode character</td><td>all</td></tr>
<tr><td nowrap><samp>duplicate-member-names-absent</samp></td><td>No object repeats a member name</td><td>all</td></tr>
<tr><td nowrap><samp>numbers-within-range</samp></td><td>Every number fits a double; every integer is exact</td><td>all</td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;2&nbsp;&#8209;&nbsp;SAFE&#8209;JSON&#8209;LD</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>context-at-root-only</samp></td><td>The file's only <code>@context</code> is at its top</td><td>all</td></tr>
<tr><td nowrap><samp>remote-contexts-absent</samp></td><td>The <code>@context</code> never refers by web address to a context kept elsewhere</td><td>all</td></tr>
<tr><td nowrap><samp>context-object-array-or-null</samp></td><td>The <code>@context</code>, if present, is an object, an array of objects, or <code>null</code></td><td>all</td></tr>
<tr><td nowrap><samp>context-containers-absent</samp></td><td>The <code>@context</code> never uses <code>@container</code> to tell a reader to interpret a property's array values as something other than individual values</td><td>all</td></tr>
<tr><td nowrap><samp>context-vocab-absent</samp></td><td>The <code>@context</code> never uses <code>@vocab</code> to tell a reader to interpret a name written without a prefix as a term of some vocabulary</td><td>all</td></tr>
<tr><td nowrap><samp>context-protected-absent</samp></td><td>The <code>@context</code> never uses <code>@protected</code> to lock its entries against redefinition by a later context</td><td>all</td></tr>
<tr><td nowrap><samp>context-propagate-absent</samp></td><td>The <code>@context</code> never uses <code>@propagate</code> to limit which objects it applies to</td><td>all</td></tr>
<tr><td nowrap><samp>context-import-absent</samp></td><td>The <code>@context</code> never uses <code>@import</code> to pull in entries from another context at a web address</td><td>all</td></tr>
<tr><td nowrap><samp>context-id-coercion-absent</samp></td><td>The <code>@context</code> never uses <code>"@type": "@id"</code> to tell a reader to interpret a property's bare-string <code>&lt;value&gt;</code> as <code>{ "@id": &lt;value&gt; }</code></td><td>all</td></tr>
<tr><td nowrap><samp>graph-at-root-only</samp></td><td><code>@graph</code> appears only at the root</td><td>all</td></tr>
<tr><td nowrap><samp>graph-object-or-array</samp></td><td>The <code>@graph</code>, if present, is an object or an array of objects</td><td>all</td></tr>
<tr><td nowrap><samp>ids-and-types-strings</samp></td><td>Every <code>@id</code> is a string; every <code>@type</code> a string or an array of strings</td><td>all</td></tr>
<tr><td nowrap><samp>id-segments-portable</samp></td><td>Every segment of a relative <code>@id</code> is a portable name: letters, digits, dots, hyphens and underscores, beginning and ending with a letter or digit</td><td>all</td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;3&nbsp;&#8209;&nbsp;TRACE&#8209;PERMISSIBLE&#8209;JSON&#8209;LD</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>root-context-and-graph-only</samp></td><td>The file is a JSON object whose top level holds no member other than <code>@context</code> and <code>@graph</code></td><td>all</td></tr>
<tr><td nowrap><samp>composite-contexts-absent</samp></td><td>The <code>@context</code> is never composed from several parts</td><td>all</td></tr>
<tr><td nowrap><samp>disallowed-node-keywords-absent</samp></td><td>Apart from the <code>@context</code> and its contents, the only keywords in the file are <code>@graph</code>, <code>@id</code> and <code>@type</code></td><td>all</td></tr>
<tr><td nowrap><samp>disallowed-context-keywords-absent</samp></td><td><code>@base</code> is the only keyword at the top level of the <code>@context</code></td><td>all</td></tr>
<tr><td nowrap><samp>base-web-scheme</samp></td><td>The <code>@base</code>, if any, uses the <code>https</code> or <code>http</code> scheme</td><td>all</td></tr>
<tr><td nowrap><samp>base-simple-url</samp></td><td>The <code>@base</code>, if any, is a simple URL. It names a host, has a path of portable names, uses only URL characters, and ends in <code>/</code>. It has no user info, dot segments, query or fragment</td><td>all</td></tr>
<tr><td nowrap><samp>prefix-namespaces-terminated</samp></td><td>Every prefix maps to an absolute IRI ending in <code>#</code> or <code>/</code></td><td>all</td></tr>
<tr><td nowrap><samp>context-aliases-absent</samp></td><td>The <code>@context</code> never defines aliases for property names</td><td>all</td></tr>
<tr><td nowrap><samp>context-assigns-only-datatypes-to-properties</samp></td><td>The only thing the <code>@context</code> assigns to a property is the datatype of its values</td><td>all</td></tr>
<tr><td nowrap><samp>context-datatypes-named-by-iri</samp></td><td>Every datatype the <code>@context</code> gives a property is named by a prefixed or absolute IRI</td><td>all</td></tr>
<tr><td nowrap><samp>types-prefixed-or-absolute</samp></td><td>Every <code>@type</code> value is a prefixed or absolute IRI</td><td>all</td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;4&nbsp;&#8209;&nbsp;USES&#8209;TROV&#8209;CORRECTLY</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>context-and-nonempty-graph-present</samp></td><td>The file has a non-null <code>@context</code> and an <code>@graph</code> holding at least one node</td><td>all</td></tr>
<tr><td nowrap><samp>core-prefixes-pinned</samp></td><td><code>trov</code> is declared and is the only prefix for a TROV namespace; <code>rdf</code>, <code>rdfs</code> and <code>schema</code> prefixes, if declared, are the standard ones</td><td>all</td></tr>
<tr><td nowrap><samp>trov-terms-known</samp></td><td>Every term with the <code>trov:</code> prefix is one TROV defines</td><td>redefined in <code>trace-0.1</code></td></tr>
<tr><td nowrap><samp>trov-version-known</samp></td><td>The TRO declares, in <code>trov:vocabularyVersion</code>, a known version of TROV</td><td>all</td></tr>
<tr><td nowrap><samp>hash-algorithms-permitted</samp></td><td>Every hash names an algorithm TRACE permits: a collision-resistant digest from the SHA-2, SHA-3 or BLAKE families</td><td>all</td></tr>
<tr><td nowrap><samp>hash-values-correct-form</samp></td><td>Every hash value is lowercase hexadecimal of the length its algorithm produces</td><td>all</td></tr>
<tr><td nowrap><samp>mime-types-two-part</samp></td><td>Every artifact's <code>trov:mimeType</code> is a string of the form <code>type/subtype</code></td><td>all</td></tr>
<tr><td nowrap><samp>times-iso-8601</samp></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> is an ISO 8601 date-time; the TRO's <code>schema:dateCreated</code>, if present, an ISO 8601 date or date-time</td><td>all</td></tr>
<tr><td nowrap><samp>times-zoned</samp></td><td>Every <code>trov:startedAtTime</code> and <code>trov:endedAtTime</code> carries its time zone</td><td>from <code>trace-0.1</code></td></tr>
<tr><td nowrap><samp>tro-name-description-text</samp></td><td>The TRO's <code>schema:name</code> and <code>schema:description</code>, if present, are Text: a string or an array of strings</td><td>all</td></tr>
<tr><td nowrap><samp>creators-person-or-organization</samp></td><td>The TRO's <code>schema:creator</code>, if present, is a node typed <code>schema:Person</code> or <code>schema:Organization</code>, never a string</td><td>from <code>trace-0.1</code></td></tr>
<tr><td nowrap><samp>trov-capabilities-predefined</samp></td><td>A capability's <code>trov:</code> type is one TROV predefines</td><td>all</td></tr>
<tr><td nowrap><samp>trov-performance-attributes-predefined</samp></td><td>A performance attribute's <code>trov:</code> type is one TROV predefines</td><td>all</td></tr>
<tr><td nowrap><samp>trov-tro-attributes-predefined</samp></td><td>A TRO attribute's <code>trov:</code> type is one TROV predefines</td><td>all</td></tr>
<tr><td nowrap><samp>custom-terms-not-trov</samp></td><td>Every <code>trov:customTerm</code> entry declares a term outside the TROV namespace</td><td>all</td></tr>
<tr><td nowrap><samp>custom-term-superclasses-extensible</samp></td><td>Every custom term extends <code>trov:TRSCapabilityType</code> or <code>trov:TRPAttributeType</code></td><td>all</td></tr>
<tr><td nowrap><samp>trov-signing-mechanisms-predefined</samp></td><td>A signing mechanism is identified by reference, and a <code>trov:</code> one is one TROV predefines</td><td>all</td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;5&nbsp;&#8209;&nbsp;DEFINES&#8209;TRS</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>trs-defined</samp></td><td>A TRS is defined, with an <code>@id</code>, at the top of the <code>@graph</code> or as the object of <code>trov:wasAssembledBy</code>, and nowhere else</td><td>all</td></tr>
<tr><td nowrap><samp>trs-id-absolute</samp></td><td>The TRS is identified by an absolute IRI, or a compact IRI outside the <code>trov</code> namespace</td><td>from <code>trace-0.1</code></td></tr>
<tr><td nowrap><samp>capability-terms-known</samp></td><td>Every capability the TRS lists is a known term: one TROV defines or the TRS declares</td><td>from <code>trace-0.1</code></td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;6&nbsp;&#8209;&nbsp;STANDALONE&#8209;TRO</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>tro-top-level-in-graph</samp></td><td>The TRO is a top-level member of the <code>@graph</code></td><td>all</td></tr>
<tr><td nowrap><samp>trov-objects-identified</samp></td><td>Every object typed with a TROV class carries an <code>@id</code></td><td>all</td></tr>
<tr><td nowrap><samp>tro-assembled-by-trs</samp></td><td>The TRO names its assembling system, typed as a TRS</td><td>all</td></tr>
<tr><td nowrap><samp>performance-attribute-warrants-absolute</samp></td><td>Every performance attribute refers to the capability warranting it by a compact or absolute IRI</td><td>from <code>trace-0.1</code></td></tr>
<tr><td nowrap><samp>tro-composition-single</samp></td><td>A <code>trov:hasComposition</code> is one object, not an array</td><td>all</td></tr>
<tr><td nowrap><samp>composition-has-fingerprint</samp></td><td>The TRO's composition, if any, carries one fingerprint, which carries one hash</td><td>all</td></tr>
<tr><td nowrap><samp>composition-identifies-artifacts</samp></td><td>The TRO's composition, if any, names at least one artifact in a <code>trov:hasArtifact</code> array</td><td>all</td></tr>
<tr><td nowrap><samp>artifact-hashes-present</samp></td><td>Every artifact in the composition carries a <code>trov:hash</code>, one hash or an array of at least one</td><td>all</td></tr>
<tr><td nowrap><samp>created-with-single-tool</samp></td><td>A <code>trov:createdWith</code> names one software tool, given as a node</td><td>all</td></tr>
<tr><td nowrap><samp>gpg-signing-key-present</samp></td><td>A TRO signed with <code>trov:GPGSigning</code> gives its TRS a <code>trov:publicKey</code></td><td>all</td></tr>
</tbody>
<tbody>
<tr><th colspan="3" align="left"><br><samp>Tier&nbsp;7&nbsp;&#8209;&nbsp;LINKABLE&#8209;TRO</samp></th></tr>
<tr><th align="left">Expectation</th><th align="left">What it requires</th><th align="left">Versions</th></tr>
<tr><td nowrap><samp>base-declared</samp></td><td>The <code>@context</code> includes an <code>@base</code></td><td>all</td></tr>
<tr><td nowrap><samp>base-has-path</samp></td><td>The <code>@base</code> names something below the host, not the host alone</td><td>all</td></tr>
<tr><td nowrap><samp>base-host-lowercase</samp></td><td>The <code>@base</code> host is lowercase</td><td>all</td></tr>
<tr><td nowrap><samp>base-host-ownable</samp></td><td>The <code>@base</code> host is a domain name the minter could hold, not a reserved or documentation name</td><td>all</td></tr>
<tr><td nowrap><samp>node-ids-present</samp></td><td>Every node carries an explicit <code>@id</code></td><td>all</td></tr>
<tr><td nowrap><samp>blank-node-ids-absent</samp></td><td>No <code>@id</code> is a blank node identifier</td><td>all</td></tr>
</tbody>
</table>

<!-- end: tier-expectations -->

## How expectations are checked

Each expectation is defined by a file in a version's directory under
[`exports/versions/`](exports/versions). Most are JSON Schemas, in
files ending `.schema.json`. Two widely used JSON Schema validators,
[python-jsonschema](https://github.com/python-jsonschema/jsonschema) and
[Ajv](https://ajv.js.org/), check each one through the wrappers in
[`json-schema-dev`](https://github.com/CIRSS/json-schema-dev), and the expectation is not
met if either validator rejects the candidate. A schema can name options to pass to both
validators, as `duplicate-member-names-absent` passes `--reject-duplicate-members`. The
rest, in files ending `.parse.json`, are checked by `check-tro` itself as it reads the
candidate, such as whether the candidate is UTF-8 and parses as JSON. What these check is
written in `check-tro`, so a later version can redefine only their descriptions.

### Supported parsers and processors

`Tier 1 - SAFE-JSON` and `Tier 2 - SAFE-JSON-LD` promise that a candidate reads the same way in
every *supported* implementation. The supported implementations are these:

| | Implementation | Version |
| --- | --- | --- |
| JSON parser | Python `json` (via `jsonschema-validate`) | 3.10 |
| JSON parser | Node.js `JSON.parse` (via `ajv-validate` and `check-tro`) | 22 |
| JSON-LD processor | [jsonld.js](https://github.com/digitalbazaar/jsonld.js) | 8.3.3 |
| JSON-LD processor | [PyLD](https://github.com/digitalbazaar/pyld) | 3.3.0 |
| JSON-LD processor | [rdflib](https://github.com/RDFLib/rdflib) | 7.6.0 |

[`docs/safe-json-ld-constructs.md`](docs/safe-json-ld-constructs.md) lists, for each construct
`Tier 2 - SAFE-JSON-LD` excludes, the W3C tests the supported JSON-LD processors do not all pass.

## Reports

One report is written for each target of each candidate. It opens by saying what the
candidate is, which tier it is expected to satisfy at which version, and how it came out.
Tables follow with the status of each tier and of each expectation. For each expectation
not met, the report then lists every error found: what was found, where in the candidate,
and why it does not meet the expectation. Each error is listed once, whichever validator
reported it. A tier named in the opening or in the table of tiers links to that tier's
expectations, and an expectation that is not met links to its errors.

A tier up to the target is met when every expectation in it and in every tier
below it is met, and not met otherwise; a tier above the target is not claimed.

An expectation in a claimed tier is met, not met, or not assessed. It is not
assessed when `Tier 1 - SAFE-JSON`, `Tier 2 - SAFE-JSON-LD` or
`Tier 3 - TRACE-PERMISSIBLE-JSON-LD` below it is not
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
        "target": {
            "tier": "STANDALONE-TRO",
            "version": "trace-2026-04-19"
        },
        "title": "A few words naming this candidate. Heads its reports in the summary.",
        "description": "What this candidate is. Copied into its reports."
    }
}
```

A candidate can have several targets. Its `target` is then a list, and the candidate is
checked against each:

```json
        "target": [
            { "tier": "USES-TROV-CORRECTLY", "version": "trace-2026-04-19" },
            { "tier": "STANDALONE-TRO", "version": "trace-2026-04-19" },
            { "tier": "USES-TROV-CORRECTLY", "version": "trace-0.1" }
        ],
```

`check-tros` checks what the manifest declares: a `.jsonld` file the manifest
does not name is reported as skipped, and an entry naming a file that is not in
the directory stops the run. `make build-reports` in the REPRO writes one report
per target to `reports/<name>__at__<version>__to__tier-<number>.md`, and a summary,
`reports/README.md`, that lists the reports under each candidate, says whether each
target was met, and links to each report. A candidate is headed there by its `title`, or
by its name where the manifest gives it no title.

`check-tros` takes each target's tier and version from the manifest. It
assumes `STANDALONE-TRO` when the manifest names no tier, and `trace-2026-04-19`
when it names no version. `--target-tier` and `--target-version` each replace that half
of every target in the run, and a candidate is checked once against targets that are then
the same. The report says where the tier and the version each came
from: the manifest, the option, or the default.

## Key files

| File | What it is |
| --- | --- |
| [`exports/versions.json`](exports/versions.json) | The versions of the Specification in order, each with its ID and description. |
| [`exports/versions/<version>/`](exports/versions) | What a version adds or changes: the expectations it introduces or redefines, and its `tiers.json` where its tiers change. |
| `exports/versions/<version>/*.schema.json` | Expectations checked by JSON Schema, one schema each. A schema's `$id` names the version whose directory holds it. |
| `exports/versions/<version>/*.parse.json` | Expectations `check-tro` checks as it parses a candidate, each giving its summary and description. |
| `exports/versions/<version>/tiers.json` | The tiers in order, each with its ID, description, the expectations that belong to it, and `blocksHigherTiers` where no tier above it is assessed until it is met. It decides which expectations the version applies. A listed expectation with no file at or before the version, a file in the version's directory its tiers do not list, or a tier with no expectations stops every run. |
| [`exports/check-tro.js`](exports/check-tro.js) | The checker. Applies the expectations in a candidate's target and writes the report. Installed as `check-tro`. |
| [`exports/check-tros.js`](exports/check-tros.js) | Runs the checker over the candidates the manifest names, each against each of its targets, writing one report per target and `reports/README.md`, the summary that links to them. Installed as `check-tros`. |
| [`exports/render-readme.js`](exports/render-readme.js) | Writes this README's account of what is checked from the tiers and the expectations themselves. Run by `make update-readme`. |
| [`pseudocode/`](pseudocode) | What the checker does, in outline. |
| [`GLOSSARY.md`](GLOSSARY.md) | The key entities the tools in this repository concern. |
| [`models/`](models/README.md) | How the key entities fit together, each subject modeled in more than one paradigm. |
| [`docs/json-schema-capabilities.md`](docs/json-schema-capabilities.md) | The JSON Schema capabilities the expectations use, each with its demo in [`json-schema-demos`](https://github.com/CIRSS/json-schema-demos). |
| [`docs/safe-json-ld-constructs.md`](docs/safe-json-ld-constructs.md) | For each construct `Tier 2 - SAFE-JSON-LD` excludes, the W3C tests the supported JSON-LD processors do not all pass. |
| [`REVIEWS.md`](REVIEWS.md) | Who has reviewed each file, at what level of detail. |
| [`demo/`](demo) | Demos of checking particular expectations. |

## Building the Docker image

To build the image, run these commands in the top-level directory of a clone of this repository:

```
make build-parent      # once, on a fresh clone
make build-image
```

`make test-code` checks the checker's JavaScript against the type annotations
in its comments, with the configuration in `jsconfig.json` that the editor also
reads. A field renamed in one file and not in another fails there.

## Adding an expectation

Put a `<name>.schema.json` with a `summary` and a `description` in the directory of the
version it first applies under, [`exports/versions/<version>/`](exports/versions), with an
`$id` naming that version, and a `requires` listing any expectations that must be met
before it is checked. Add it to a tier in that version's `tiers.json`, copying the latest
`tiers.json` before it if the version has none, after every expectation it requires:
expectations are checked and reported in the order the tiers list them. List it in
[`exports/base-manifest`](exports/base-manifest) by its path, three times on one line, as
the other versioned files are. Then run `make update-readme`, which writes its row into the
table under *What is checked* above from the `summary` you gave it. Add it to
[`docs/json-schema-capabilities.md`](docs/json-schema-capabilities.md), and include a demo
in [`demo/`](demo).

To redefine an expectation in a later version, put a complete copy of its file, changed, in
that version's directory; its name and `summary` stay the same. To retire it, leave it out
of that version's `tiers.json`. A version that lists a retired expectation again gives it a
file of its own.

The `summary` is the row. Write it as plain prose with no line breaks of your
own: the table is HTML, and the reader's browser breaks it to the width it has.
