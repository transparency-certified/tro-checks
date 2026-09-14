#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target 0 --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 06: disallowed-context-keywords-absent (Tier 0)"

show "expectation met: the @context uses only @base" \
    report_on instance-allowed-context-keywords.jsonld

show "expectation unmet: the @context uses @vocab" \
    report_on instance-vocab-in-context.jsonld

exit 0
