#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target LINKABLE-TRO --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 43: node-ids-present (TIER 5 - LINKABLE-TRO)"

show "expectation met: every node carries an @id" \
    report_on instance-node-ids-present.jsonld

show "expectation unmet: the assembling system has no @id, so nothing outside can name it" \
    report_on instance-node-without-id.jsonld

exit 0
