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

title "tro-checks  ·  demo 48: artifact-hashes-present (TIER 6 - STANDALONE-TRO)"

show "expectation met: one artifact carries a hash object, another an array of two" \
    report_on instance-hashes-present.jsonld

show "expectation unmet: an artifact carries no trov:hash" \
    report_on instance-artifact-without-hash.jsonld

show "expectation unmet: an artifact's trov:hash is an empty array" \
    report_on instance-empty-hash-array.jsonld

exit 0
