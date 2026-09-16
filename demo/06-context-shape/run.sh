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

title "tro-checks  ·  demo 06: context-well-formed (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the @context value is a string" \
    report_on instance-context-string.jsonld

show "expectation unmet: the @context value is a number" \
    report_on instance-context-number.jsonld

show "expectation met: every member of the @context array is a string or a context object" \
    report_on instance-context-array.jsonld

show "expectation unmet: a member of the @context array is a number" \
    report_on instance-context-array-with-number.jsonld

exit 0
