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

title "tro-checks  ·  demo 42: custom-terms-not-trov (TIER 4 - STANDALONE-TRO)"

show "expectation met: both custom terms are in the ex: namespace, outside TROV's" \
    report_on instance-producer-namespace.jsonld

show "expectation unmet: a custom term redeclares trov:CanProvideInternetIsolation" \
    report_on instance-trov-prefixed-term.jsonld

show "expectation unmet: a custom term is declared in the TROV namespace by absolute IRI" \
    report_on instance-trov-absolute-term.jsonld

exit 0
