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

title "tro-checks  ·  demo 32: hash-values-lowercase-hex (TIER 4 - STANDALONE-TRO)"

show "expectation met: every value is lowercase hexadecimal" \
    report_on instance-lowercase-hex.jsonld

show "expectation unmet: a value is written in uppercase" \
    report_on instance-uppercase-hex.jsonld

show "expectation unmet: a value ends in the letter g" \
    report_on instance-non-hex-character.jsonld

exit 0
