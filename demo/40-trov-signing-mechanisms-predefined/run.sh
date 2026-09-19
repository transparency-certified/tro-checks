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

title "tro-checks  ·  demo 40: trov-signing-mechanisms-predefined (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: the TRO is signed with trov:X509CMSSigning" \
    report_on instance-predefined-mechanism.jsonld

show "expectation met: the TRO is signed with the producer's ex:ThresholdSigning" \
    report_on instance-custom-mechanism.jsonld

show "expectation unmet: the signing mechanism is trov:CanProvideInternetIsolation, a capability" \
    report_on instance-capability-as-mechanism.jsonld

show "expectation unmet: the signing mechanism is identified by a string, not by reference" \
    report_on instance-mechanism-as-string.jsonld

exit 0
