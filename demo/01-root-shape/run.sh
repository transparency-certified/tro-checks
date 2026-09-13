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

title "tro-checks  ·  demo 01: document-rooted-in-nodes (Tier 0)"

show "expectation met: the document is a node object" \
    report_on instance-node-object.jsonld

show "expectation unmet: the document is a string" \
    report_on instance-string.jsonld

show "expectation met: every member of the array is a node object" \
    report_on instance-array-of-node-objects.jsonld

show "expectation unmet: a member of the array is a string" \
    report_on instance-array-with-scalar.jsonld

exit 0
