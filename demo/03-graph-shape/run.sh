#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target 0 --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 03: graph-well-formed (Tier 0)"

show "expectation met: the @graph value is a node object" \
    report_on instance-graph-node-object.jsonld

show "expectation unmet: the @graph value is a string" \
    report_on instance-graph-string.jsonld

show "expectation met: every member of the @graph array is a node object" \
    report_on instance-graph-array.jsonld

show "expectation unmet: a member of the @graph array is a string" \
    report_on instance-graph-array-with-scalar.jsonld

exit 0
