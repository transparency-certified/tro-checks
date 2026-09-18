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

title "tro-checks  ·  demo 43: custom-term-superclasses-extensible (TIER 4 - STANDALONE-TRO)"

show "expectation met: the custom terms extend trov:TRSCapabilityType and trov:TRPAttributeType" \
    report_on instance-extensible-superclasses.jsonld

show "expectation unmet: a custom term extends trov:TRSCapability" \
    report_on instance-superclass-not-extensible.jsonld

show "expectation unmet: a custom term names its superclass as a string" \
    report_on instance-superclass-as-string.jsonld

exit 0
