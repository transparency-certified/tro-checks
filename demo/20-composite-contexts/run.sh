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

title "tro-checks  ·  demo 20: composite-contexts-absent (TIER 3 - TRACE-PERMISSIBLE-JSON-LD)"

show "expectation met: the @context is one object" \
    report_on instance-single-object.jsonld

show "expectation met: the @context is one object in brackets, as the Declaration Format writes it" \
    report_on instance-single-object-in-array.jsonld

show "expectation unmet: the @context is composed from two parts" \
    report_on instance-two-parts.jsonld

exit 0
