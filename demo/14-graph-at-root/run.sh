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

title "tro-checks  ·  demo 14: graph-at-root-only (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the only @graph is the root's" \
    report_on instance-graph-at-root.jsonld

show "expectation unmet: a node carries an @graph of its own" \
    report_on instance-nested-graph.jsonld

exit 0
