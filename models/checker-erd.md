# Checker model: entities and relationships

The entities the checker works with, drawn as an entity-relationship diagram: how many of each at every line end, and a label on each line that completes a sentence from one entity to the other, as in *Error is a failure of Check*.

```mermaid
erDiagram
    Specification {
        string release
        string url
    }
    Report }o--|| Specification : cites
    Expectation }o--|| Specification : "is derived from"
    Specification |o--o| Specification : "is succeeded by"

    Candidate {
        string fileName
        string description
        string targetSource
    }
    Tier {
        int number
        string name
        string description
    }
    Expectation {
        string name
        string schemaPath
        string summary
        string description
    }
    Validator {
        string command
    }
    Determination {
        boolean isValid
    }
    ValidatorReport {
    }
    Check {
        list clauses
        string authoredMessage
    }
    Error {
        list site
    }
    Diagnostic {
        list site
        list clause
        string keyword
        object constraint
        object particulars
        any found
        string message
    }
    Attempt {
        list clause "for anyOf, oneOf"
        list site "for contains"
    }
    Finding {
        string outcome
    }
    Assessment {
        string outcome
    }
    Report {
    }

    Candidate }o--|| Tier : targets
    Tier ||--o{ Expectation : holds
    Expectation ||--|{ Check : "is verified by performing"
    Determination }o--|| Validator : "is made by"
    Determination }o--|| Expectation : "is made against"
    Determination }o--|| Candidate : "is about"
    Determination ||--|| ValidatorReport : has
    ValidatorReport ||--o{ Diagnostic : lists
    Diagnostic }|--o| Error : "reports (at most one per Validator)"
    Diagnostic ||--o{ Attempt : has
    Attempt ||--|{ Diagnostic : "is explained by"
    Error }o--|| Check : "is a failure of"
    Finding }o--|| Expectation : "is of"
    Finding }o--|| Candidate : "is about"
    Finding ||--o{ Error : has
    Assessment }o--|| Tier : "is of"
    Assessment }o--|| Candidate : "is about"
    Report ||--|| Candidate : "is about"
    Report }o--|{ Tier : "lists every"
    Report ||--o{ Assessment : "has (one per targeted Tier)"
    Report ||--|{ Finding : "has (one per Expectation)"
```
