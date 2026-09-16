#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target TRACE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 18: disallowed-context-keywords-absent (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the @context uses only @base" \
    report_on instance-allowed-context-keywords.jsonld

show "expectation unmet: the @context uses @vocab" \
    report_on instance-vocab-in-context.jsonld

exit 0
