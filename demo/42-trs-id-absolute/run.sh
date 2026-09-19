#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target DEFINES-TRS --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 42: trs-id-absolute (TIER 5 - DEFINES-TRS)"

show "expectation met: the TRS is identified by an absolute IRI" \
    report_on instance-trs-absolute-iri.jsonld

show "expectation met: the TRS is identified by the compact IRI ex:trs" \
    report_on instance-trs-compact-iri.jsonld

show "expectation unmet: the TRS is identified by the relative id trs" \
    report_on instance-trs-relative.jsonld

show "expectation unmet: the TRS is identified by trov:TrustedResearchSystem, a TROV term" \
    report_on instance-trs-trov.jsonld

exit 0
