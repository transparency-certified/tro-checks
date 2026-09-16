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

title "tro-checks  ·  demo 22: context-local (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the @context is written into the declaration" \
    report_on instance-inline-context.jsonld

show "expectation unmet: the @context names a remote context" \
    report_on instance-remote-context.jsonld

show "expectation unmet: an @context array includes a remote context" \
    report_on instance-remote-in-array.jsonld

exit 0
