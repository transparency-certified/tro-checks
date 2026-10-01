#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier STANDALONE-TRO --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 51: trov-objects-identified (TIER 6 - STANDALONE-TRO)"

show "expectation met: every object typed with a TROV class carries an @id" \
    report_on instance-objects-identified.jsonld

show "expectation unmet: the artifact is typed trov:ResearchArtifact and carries no @id" \
    report_on instance-artifact-without-id.jsonld

exit 0
