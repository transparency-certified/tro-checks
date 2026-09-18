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

title "tro-checks  ·  demo 33: hash-values-correct-length (TIER 4 - STANDALONE-TRO)"

show "expectation met: sha256, sha512 and blake2b values of 64, 128 and 128 digits" \
    report_on instance-correct-lengths.jsonld

show "expectation unmet: a sha512 value has 64 digits, not 128" \
    report_on instance-sha512-too-short.jsonld

show "expectation unmet: a sha256 value has 65 digits, not 64" \
    report_on instance-sha256-too-long.jsonld

exit 0
