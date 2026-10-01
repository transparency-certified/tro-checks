#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier TRACE-PERMISSIBLE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 22: disallowed-context-keywords-absent (TIER 3 - TRACE-PERMISSIBLE-JSON-LD)"

show "expectation met: the @context uses only @base" \
    report_on instance-allowed-context-keywords.jsonld

show "expectation unmet: the @context uses @version" \
    report_on instance-version-in-context.jsonld

exit 0
