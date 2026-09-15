#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target VALID-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 05: ids-and-types-strings (TIER 2 - VALID-JSON-LD)"

show "expectation met: every @id is a string, and every @type a string or an array of strings" \
    report_on instance-string-ids-and-types.jsonld

show "expectation unmet: a nested @id is a number" \
    report_on instance-number-id.jsonld

show "expectation unmet: an @type array holds an object" \
    report_on instance-type-array-with-object.jsonld

exit 0
