# Capabilities

What each expectation in [`exports/`](exports) depends on, named without its `.schema.json` suffix. A capability is a JSON Schema construct; the number beside it is the demo in [`CIRSS/json-schema-demos`](https://github.com/CIRSS/json-schema-demos) that demonstrates it. Capability names and demo numbers are that gallery's, from its [`CAPABILITIES.md`](https://github.com/CIRSS/json-schema-demos/blob/main/CAPABILITIES.md).

Every expectation uses `dialect-declaration` (`22`), `id-and-anchor` (`13`), `error-message` (`19`), `type` (`02`), and `annotations` (`06`). The table below lists what each uses beyond those.

| Expectation | Tier | Capabilities used |
| --- | --- | --- |
| `context-well-formed` | 0 | `type-applicability` (`05`), `properties` (`02`), `items` (`03`) |
| `graph-well-formed` | 0 | `type-applicability` (`05`), `properties` (`02`), `items` (`03`) |
| `document-rooted-in-nodes` | 0 | `type-applicability` (`05`), `items` (`03`) |
| `composition-fingerprinted` | 1 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`) |
| `trov-terms-known` | 1 | `properties` (`02`), `items` (`03`), `boolean-schema` (`01`), `additional-properties` (`09`), `pattern` (`07`), `enum` (`05`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`), `property-names` (*no demo* \*) |
| `hashes-well-formed` | 1 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `const` (`10`), `pattern` (`07`), `defs-and-ref` (`12`) |
| `context-and-graph-present` | 1 | `required` (`04`) |
| `tro-top-level-in-graph` | 1 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `const` (`10`), `contains` (`18`), `if-then-else` (`11`) |
| `tro-assembled-by-trs` | 1 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `const` (`10`), `contains` (`18`), `if-then-else` (`11`) |
| `base-declared` | 2 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `contains` (`18`), `if-then-else` (`11`) |
| `node-ids-present` | 2 | `type-applicability` (`05`), `properties` (`02`), `required` (`04`), `items` (`03`), `additional-properties` (`09`), `boolean-schema` (`01`), `not` (`08`), `anyOf` (`08`), `if-then-else` (`11`), `defs-and-ref` (`12`), `recursive-ref` (`17`) |

\* The gallery has no demo for `property-names`.
