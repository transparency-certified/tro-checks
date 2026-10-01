# Checker model: classes

The entities the checker works with, drawn as a class diagram: which entity owns which (the diamonds), which way each relationship points, and in what numbers.

```mermaid
classDiagram
    direction TB

    class Specification {
        url
    }
    class Version {
        number
        id
        description
    }
    Specification "1" *-- "1..n" Version : has
    Version "1" --> "0..1" Version : succeeded by
    Report "1" --> "1" Version : cites
    Expectation "1" --> "1" Specification : derived from
    Expectation "1" --> "0..1" Version : applies from
    Expectation "1" --> "0..1" Version : applies until
    Candidate "1" --> "1" Version : targets its Tier under

    class Candidate {
        fileName
        description
        targetTier
        targetVersion
    }
    class Tier {
        number
        id
        description
        expectations
    }
    class Expectation {
        name
        instrument
        definitionPath
        summary
        description
        validatorFlags
        fromVersion
        untilVersion
    }
    class Validator {
        command
    }
    class Determination {
        isValid
    }
    class ValidatorReport
    class Check {
        clauses
        authoredMessage
    }
    class Error {
        site
    }
    class Diagnostic {
        site
        clause
        keyword
        constraint
        particulars
        found
        message
    }
    class Attempt {
        clause
        site
    }
    class Finding {
        outcome
    }
    class Assessment {
        outcome
    }
    class Report

    Candidate "1" --> "1" Tier : targets
    Tier "1" o-- "1..n" Expectation : holds
    Expectation "0..n" --> "0..n" Expectation : requires, in its Tier
    Expectation "1" *-- "1..n" Check : verified by performing
    Determination "1" --> "1" Validator : by
    Determination "1" --> "1" Expectation : of
    Determination "1" --> "1" Candidate : about
    Determination "1" *-- "1" ValidatorReport : has
    ValidatorReport "1" *-- "0..n" Diagnostic : lists
    Diagnostic "1..n, at most 1 per Validator" --> "0..1" Error : reports
    Error "1" --> "1" Check : failure of
    Diagnostic "1" *-- "0..n" Attempt : has
    Attempt "1" *-- "1..n" Diagnostic : explained by
    Finding "1" --> "1" Expectation : of
    Finding "1" --> "1" Candidate : about
    Finding "1" o-- "0..n" Error : has
    Assessment "1" --> "1" Tier : of
    Assessment "1" --> "1" Candidate : about
    Report "1" --> "1" Candidate : about
    Report "1" --> "1..n" Tier : lists every
    Report "1" *-- "1 per targeted Tier" Assessment
    Report "1" *-- "1 per Expectation" Finding
```
