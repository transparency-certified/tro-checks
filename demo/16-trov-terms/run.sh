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

title "tro-checks  ·  demo 16: trov-terms-known (TIER 4 - STANDALONE-TRO)"

show "expectation met: the property name trov:vocabularyVersion is defined by TROV" \
    report_on instance-property-name-known.jsonld

show "expectation unmet: the property name trov:vocabularyRelease is not defined by TROV" \
    report_on instance-property-name-unknown.jsonld

show "expectation met: the @id trov:IncludesAllInputData is defined by TROV" \
    report_on instance-id-known.jsonld

show "expectation unmet: the @id trov:IncludesAllOutputData is not defined by TROV" \
    report_on instance-id-unknown.jsonld

show "expectation met: the @type trov:TrustedResearchPerformance is defined by TROV" \
    report_on instance-type-known.jsonld

show "expectation unmet: the @type trov:TrustedResearchPerformace is not defined by TROV" \
    report_on instance-type-unknown.jsonld

show "expectation met: the bare value trov:CanIsolateEnvironment is defined by TROV" \
    report_on instance-value-known.jsonld

show "expectation unmet: the bare value trov:CanIsolateNetwork is not defined by TROV" \
    report_on instance-value-unknown.jsonld

exit 0
