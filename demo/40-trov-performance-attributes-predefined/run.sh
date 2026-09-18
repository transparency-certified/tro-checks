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

title "tro-checks  ·  demo 40: trov-performance-attributes-predefined (TIER 4 - STANDALONE-TRO)"

show "expectation met: one performance attribute is TROV's trov:InternetIsolation, the other the producer's ex:AuditLogged" \
    report_on instance-predefined-and-custom.jsonld

show "expectation unmet: a performance attribute is typed trov:CanProvideInternetIsolation, a capability" \
    report_on instance-capability-as-attribute.jsonld

exit 0
