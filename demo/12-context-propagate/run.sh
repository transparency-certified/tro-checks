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

title "tro-checks  ·  demo 12: context-propagate-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the @context does not limit which objects it applies to" \
    report_on instance-no-propagate.jsonld

show "expectation unmet: the @context limits which objects it applies to" \
    report_on instance-propagate.jsonld

exit 0
