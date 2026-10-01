# Version history

What each version of the Specification changes in the expectations, from the version before it. Generated from `exports/versions/` by `make update-readme`; not to be edited by hand.

`trace-spec-2026-04-19` is the first version: its directory holds every expectation it lists.

## `0.1`

Adds `times-zoned`, `creators-person-or-organization`, `trs-id-absolute`, `capability-ids-absolute`, `performance-attribute-warrants-absolute`.

### `tiers.json`

```diff
              "mime-types-two-part",
              "times-iso-8601",
+             "times-zoned",
              "tro-name-description-text",
+             "creators-person-or-organization",
              "trov-capabilities-predefined",
              "trov-performance-attributes-predefined",
  …
      {
          "id": "DEFINES-TRS",
-         "description": "JSON-LD that defines a Trusted Research System",
+         "description": "JSON-LD that defines a Trusted Research System, identified by an absolute IRI",
          "expectations": [
-             "trs-defined"
+             "trs-defined",
+             "trs-id-absolute",
+             "capability-ids-absolute"
          ]
      },
  …
              "trov-objects-identified",
              "tro-assembled-by-trs",
+             "performance-attribute-warrants-absolute",
              "tro-composition-single",
              "composition-has-fingerprint",
  …
```

### `trov-terms-known`

```diff
  {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
-     "$id": "https://w3id.org/trace/tro/trace-spec-2026-04-19/trov-terms-known.schema.json",
+     "$id": "https://w3id.org/trace/tro/0.1/trov-terms-known.schema.json",
      "title": "TROV terms known",
      "description": "Where a property name or a string value carries the trov: prefix, it is a term TROV defines.",
  …
      "$defs": {
          "knownTrovTerm": {
-             "$comment": "Most terms are transcribed from the published Vocabulary Reference. trov:TRSCapabilityType and trov:TRPAttributeType are prescribed by the published Extension Guide and used in the Declaration Format; trov:SigningMechanism, trov:GPGSigning and trov:X509CMSSigning were announced separately. trov:contact, trov:description, trov:name, trov:owner and trov:url are pre-release terms the published Sample Implementation and Extension Guide use for a TRS.",
+             "$comment": "Most terms are transcribed from the published Vocabulary Reference. trov:TRSCapabilityType and trov:TRPAttributeType are prescribed by the published Extension Guide and used in the Declaration Format; trov:SigningMechanism, trov:GPGSigning and trov:X509CMSSigning were announced separately.",
              "if": {
                  "type": "string",
  …
                      "trov:artifact",
                      "trov:boundTo",
-                     "trov:contact",
                      "trov:contributedToArrangement",
                      "trov:createdWith",
                      "trov:customTerm",
-                     "trov:description",
                      "trov:endedAtTime",
                      "trov:hasArrangement",
  …
                      "trov:hashValue",
                      "trov:mimeType",
-                     "trov:name",
-                     "trov:owner",
                      "trov:path",
                      "trov:publicKey",
                      "trov:signingMechanism",
                      "trov:startedAtTime",
-                     "trov:url",
                      "trov:vocabularyVersion",
                      "trov:warrantedBy",
  …
```
