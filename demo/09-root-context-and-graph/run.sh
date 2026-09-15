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

title "tro-checks  ·  demo 09: root-context-and-graph-only (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the root has an @context, an @graph, and nothing else" \
    report_on instance-context-and-graph.jsonld

show "expectation unmet: the root has only an @context" \
    report_on instance-context-only.jsonld

show "expectation unmet: the node is written at the root instead of in an @graph" \
    report_on instance-node-at-root.jsonld

show "expectation unmet: the root has a member beside @context and @graph" \
    report_on instance-extra-root-member.jsonld

exit 0
