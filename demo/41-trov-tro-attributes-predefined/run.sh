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

title "tro-checks  ·  demo 41: trov-tro-attributes-predefined (TIER 4 - STANDALONE-TRO)"

show "expectation met: the TRO attribute is trov:IncludesAllInputData" \
    report_on instance-predefined.jsonld

show "expectation unmet: a TRO attribute is typed trov:InternetIsolation, a performance attribute" \
    report_on instance-performance-attribute-as-tro-attribute.jsonld

exit 0
