#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target SAFE-JSON --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 05: numbers-within-range (TIER 1 - SAFE-JSON)"

show "expectation met: every number fits a double, and the largest integer is exact" \
    report_on instance-numbers-in-range.jsonld

show "expectation unmet: an integer one past 2^53 parses as a different integer" \
    report_on instance-inexact-integer.jsonld

show "expectation unmet: a number too large for a double parses as infinity" \
    report_on instance-overflowing-number.jsonld

exit 0
