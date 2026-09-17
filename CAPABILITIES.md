# Capabilities

What each JSON Schema expectation in [`exports/`](exports) depends on, named without its `.schema.json` suffix. A capability is a JSON Schema construct; the number beside it is the demo in [`CIRSS/json-schema-demos`](https://github.com/CIRSS/json-schema-demos) that demonstrates it. Capability names and demo numbers are that gallery's, from its [`CAPABILITIES.md`](https://github.com/CIRSS/json-schema-demos/blob/main/CAPABILITIES.md). Expectations checked by `check-tro` as it parses a candidate, such as `json-parses`, use no JSON Schema capabilities and are not listed.

Every expectation listed uses `dialect-declaration` (`22`), `id-and-anchor` (`13`), and `annotations` (`06`), and all but `duplicate-member-names-absent` use `error-message` (`19`) and `type` (`02`). The table below lists what each uses beyond those. `summary`, `requires` and `validatorFlags` are this repository's own keywords, which `check-tro` reads and the validators ignore.

| Tier | Expectation | Capabilities used |
| --- | --- | --- |
| 1 | `duplicate-member-names-absent` | no schema capabilities; the validator-contract capability `duplicate-member-detection` (`21`) |
| 2 | `context-well-formed` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`) |
| 2 | `graph-well-formed` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`) |
| 2 | `ids-and-types-strings` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 2 | `context-at-root-only` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `boolean-schema` (`01`) |
| 2 | `containers-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 2 | `vocab-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 2 | `context-protection-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `allOf` (`12`) |
| 2 | `id-coercion-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `not` (`08`), `const` (`10`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 2 | `graph-at-root-only` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `boolean-schema` (`01`) |
| 2 | `id-segments-portable` | `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `pattern` (`07`), `not` (`08`), `allOf` (`12`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 3 | `root-context-and-graph-only` | `properties` (`02`), `required` (`04`), `boolean-schema` (`01`), `additional-properties` (`09`) |
| 3 | `disallowed-node-keywords-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `pattern` (`07`), `enum` (`05`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `property-names` (*no demo* \*) |
| 3 | `disallowed-context-keywords-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `pattern` (`07`), `const` (`10`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `property-names` (*no demo* \*) |
| 3 | `base-web-scheme` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `pattern` (`07`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 3 | `base-simple-url` | `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `pattern` (`07`), `not` (`08`), `allOf` (`12`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 3 | `prefix-namespaces-terminated` | `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `pattern` (`07`), `allOf` (`12`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `pattern-properties` (*no demo* \*) |
| 3 | `context-local` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `not` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 3 | `context-aliases-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `required` (`04`), `not` (`08`), `pattern` (`07`), `boolean-schema` (`01`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 3 | `types-prefixed-or-absolute` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `pattern` (`07`), `boolean-schema` (`01`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 4 | `core-prefixes-pinned` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `additional-properties` (`09`), `const` (`10`), `enum` (`05`), `not` (`08`), `contains` (`18`), `if-then-else` (`11`), `defs-and-ref` (`12`) |
| 4 | `trov-terms-known` | `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `pattern` (`07`), `enum` (`05`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `property-names` (*no demo* \*) |
| 4 | `tro-top-level-in-graph` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `const` (`10`), `contains` (`18`), `if-then-else` (`11`) |
| 4 | `tro-assembled-by-trs` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `const` (`10`), `contains` (`18`), `anyOf` (`08`), `if-then-else` (`11`) |
| 4 | `composition-fingerprinted` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`) |
| 4 | `hashes-well-formed` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `const` (`10`), `pattern` (`07`), `defs-and-ref` (`12`) |
| 5 | `base-declared` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `contains` (`18`), `if-then-else` (`11`) |
| 5 | `base-has-path` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `pattern` (`07`) |
| 5 | `base-host-lowercase` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `pattern` (`07`), `not` (`08`) |
| 5 | `base-host-ownable` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `pattern` (`07`), `not` (`08`), `allOf` (`12`) |
| 5 | `node-ids-present` | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `additional-properties` (`09`), `boolean-schema` (`01`), `not` (`08`), `anyOf` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |
| 5 | `blank-node-ids-absent` | `type-applicability` (`05`), `properties` (`02`), `items` (`03`), `additional-properties` (`09`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `pattern` (`07`), `not` (`08`), `boolean-schema` (`01`) |

\* The gallery has no demo for `property-names` or `pattern-properties`.
