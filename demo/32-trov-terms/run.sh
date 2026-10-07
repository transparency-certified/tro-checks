#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    local version="${2:-trace-2026-04-19}"
    cat "$1"
    echo
    check-tro --target-tier USES-TROV-CORRECTLY --target-version "$version" --compact --candidate "$1" --report "tmp/${1%.jsonld}__at__${version}.md"
    echo
    cat "tmp/${1%.jsonld}__at__${version}.md"
}

title "tro-checks  ·  demo 32: trov-terms-known (Tier 4 - USES-TROV-CORRECTLY)"

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

show "expectation met at version trace-2026-04-19: the TRS's trov:name is a pre-release term that version admits" \
    report_on instance-trs-name.jsonld trace-2026-04-19

show "expectation unmet at version trace-main: trov:name is not defined by TROV" \
    report_on instance-trs-name.jsonld trace-main

exit 0
