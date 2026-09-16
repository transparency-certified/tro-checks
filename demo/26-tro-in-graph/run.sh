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

title "tro-checks  ·  demo 26: tro-top-level-in-graph (TIER 4 - STANDALONE-TRO)"

show "expectation met: the TRO is a top-level member of the @graph" \
    report_on instance-tro-in-graph.jsonld

show "expectation unmet: the @graph holds no TRO, so the expectations requiring one are not assessed" \
    report_on instance-no-tro-in-graph.jsonld

exit 0
