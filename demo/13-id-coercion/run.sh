#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target SAFE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 13: id-coercion-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: a term definition types its values with an absolute IRI" \
    report_on instance-typed-values.jsonld

show "expectation unmet: a term definition coerces its values to identifiers" \
    report_on instance-id-coercion.jsonld

exit 0
