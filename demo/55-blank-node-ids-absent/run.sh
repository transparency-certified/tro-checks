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

title "tro-checks  ·  demo 55: blank-node-ids-absent (TIER 7 - LINKABLE-TRO)"

show "expectation met: no @id is a blank node identifier" \
    report_on instance-named-ids.jsonld

show "expectation unmet: a _: label is scoped to this document and any processor may rename it" \
    report_on instance-blank-node-id.jsonld

exit 0
