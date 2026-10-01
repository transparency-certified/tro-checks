#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier USES-TROV-CORRECTLY --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 30: context-and-nonempty-graph-present (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: a context and a graph holding the TRO" \
    report_on instance-context-and-graph.jsonld

show "expectation unmet: the @context is null, so trov: stands for nothing" \
    report_on instance-null-context.jsonld

show "expectation unmet: there is no @graph" \
    report_on instance-no-graph.jsonld

show "expectation unmet: the @graph holds no nodes" \
    report_on instance-empty-graph.jsonld

exit 0
