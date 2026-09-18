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

title "tro-checks  ·  demo 38: tro-name-description-text (TIER 4 - STANDALONE-TRO)"

show "expectation met: schema:name and schema:description are strings" \
    report_on instance-name-description-strings.jsonld

show "expectation met: schema:name is an array of two strings" \
    report_on instance-name-array.jsonld

show "expectation unmet: schema:name is an object" \
    report_on instance-name-object.jsonld

show "expectation unmet: schema:description is a number" \
    report_on instance-description-number.jsonld

exit 0
