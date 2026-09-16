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

title "tro-checks  ·  demo 11: vocab-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: every term is declared, with no default vocabulary" \
    report_on instance-no-vocab.jsonld

show "expectation unmet: the @context declares a default vocabulary" \
    report_on instance-vocab.jsonld

exit 0
