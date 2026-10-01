#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier TRACE-PERMISSIBLE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 19: root-context-and-graph-only (TIER 3 - TRACE-PERMISSIBLE-JSON-LD)"

show "expectation met: the top level holds an @context and an @graph" \
    report_on instance-context-and-graph.jsonld

show "expectation met: the top level holds only an @context, which is not required here" \
    report_on instance-context-only.jsonld

show "expectation unmet: the node is written at the top level instead of in an @graph" \
    report_on instance-node-at-root.jsonld

show "expectation unmet: the top level holds a member beside @context and @graph" \
    report_on instance-extra-root-member.jsonld

exit 0
