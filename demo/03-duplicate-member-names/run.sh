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

title "tro-checks  ·  demo 03: duplicate-member-names-absent (TIER 1 - SAFE-JSON)"

show "expectation met: no object repeats a member name" \
    report_on instance-names-unique.jsonld

show "expectation unmet: a node repeats ex:name, and a parser keeps only the last value" \
    report_on instance-nested-duplicate.jsonld

show "expectation unmet: the root repeats @context, so the second silently replaces the first" \
    report_on instance-duplicate-context.jsonld

exit 0
