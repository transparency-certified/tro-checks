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

title "tro-checks  ·  demo 28: composition-has-fingerprint (TIER 4 - STANDALONE-TRO)"

show "expectation met: the composition carries one fingerprint with one hash" \
    report_on instance-fingerprint-present.jsonld

show "expectation unmet: the composition carries no fingerprint" \
    report_on instance-no-fingerprint.jsonld

show "expectation unmet: trov:hasFingerprint is an array" \
    report_on instance-fingerprint-array.jsonld

show "expectation unmet: the fingerprint's trov:hash is an array" \
    report_on instance-fingerprint-hash-array.jsonld

exit 0
