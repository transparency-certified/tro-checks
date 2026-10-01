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

title "tro-checks  ·  demo 11: context-protected-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the @context does not protect its terms" \
    report_on instance-no-protection.jsonld

show "expectation unmet: the @context protects its terms" \
    report_on instance-protected.jsonld

exit 0
