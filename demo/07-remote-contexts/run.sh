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

title "tro-checks  ·  demo 07: remote-contexts-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the @context is included in the file" \
    report_on instance-inline-context.jsonld

show "expectation unmet: the @context is a web address" \
    report_on instance-remote-context.jsonld

show "expectation unmet: an @context array includes a web address" \
    report_on instance-remote-in-array.jsonld

exit 0
