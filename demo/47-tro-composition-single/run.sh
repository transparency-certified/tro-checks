#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target STANDALONE-TRO --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 47: tro-composition-single (TIER 6 - STANDALONE-TRO)"

show "expectation met: the TRO carries one composition, an object" \
    report_on instance-composition-single.jsonld

show "expectation unmet: the composition is written as an array of one" \
    report_on instance-compositions-array.jsonld

exit 0
