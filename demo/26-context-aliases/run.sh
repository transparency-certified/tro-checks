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

title "tro-checks  ·  demo 26: context-aliases-absent (TIER 3 - TRACE-PERMISSIBLE-JSON-LD)"

show "expectation met: the @context gives a property a datatype and renames nothing" \
    report_on instance-typed-term.jsonld

show "expectation unmet: the @context defines an alias for a property name" \
    report_on instance-alias.jsonld

exit 0
