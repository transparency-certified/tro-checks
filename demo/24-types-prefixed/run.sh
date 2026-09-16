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

title "tro-checks  ·  demo 24: types-prefixed-or-absolute (TIER 3 - TRACE-JSON-LD)"

show "expectation met: every @type is prefixed or absolute" \
    report_on instance-prefixed-types.jsonld

show "expectation unmet: a @type is a bare name" \
    report_on instance-bare-type.jsonld

show "expectation unmet: one of a node's types is a bare name" \
    report_on instance-bare-type-in-array.jsonld

exit 0
