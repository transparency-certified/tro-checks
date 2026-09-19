#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target USES-TROV-CORRECTLY --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 35: trov-capabilities-predefined (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: one capability is TROV's trov:CanProvideInternetIsolation, the other the producer's ex:CanLogAudits" \
    report_on instance-predefined-and-custom.jsonld

show "expectation unmet: a capability is typed trov:InternetIsolation, a performance attribute" \
    report_on instance-attribute-as-capability.jsonld

exit 0
