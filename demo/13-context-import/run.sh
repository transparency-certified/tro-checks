#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier SAFE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 13: context-import-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the @context pulls in no other context" \
    report_on instance-no-import.jsonld

show "expectation unmet: the @context pulls in another context" \
    report_on instance-import.jsonld

exit 0
