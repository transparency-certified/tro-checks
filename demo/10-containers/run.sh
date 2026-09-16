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

title "tro-checks  ·  demo 10: containers-absent (TIER 2 - SAFE-JSON-LD)"

show "expectation met: no term definition declares a container" \
    report_on instance-no-containers.jsonld

show "expectation unmet: a term definition declares an @container" \
    report_on instance-set-container.jsonld

show "expectation unmet: a term definition declares a graph container" \
    report_on instance-graph-container.jsonld

exit 0
