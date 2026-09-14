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

title "tro-checks  ·  demo 05: disallowed-node-keywords-absent (Tier 0)"

show "expectation met: the nodes use only @graph, @id and @type" \
    report_on instance-allowed-node-keywords.jsonld

show "expectation unmet: a node uses @reverse" \
    report_on instance-reverse-in-body.jsonld

exit 0
