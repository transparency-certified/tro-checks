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

title "tro-checks  ·  demo 30: composition-identifies-artifacts (TIER 4 - STANDALONE-TRO)"

show "expectation met: the composition names two artifacts" \
    report_on instance-artifacts-named.jsonld

show "expectation unmet: the composition carries no trov:hasArtifact" \
    report_on instance-no-artifacts.jsonld

show "expectation unmet: trov:hasArtifact is an empty array" \
    report_on instance-empty-artifacts.jsonld

exit 0
