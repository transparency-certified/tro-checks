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

title "tro-checks  ·  demo 41: trs-defined (TIER 5 - DEFINES-TRS)"

show "expectation met: the TRS is defined in place, as the object of trov:wasAssembledBy" \
    report_on instance-trs-in-place.jsonld

show "expectation met: the TRS is a top-level node, peer to the TRO" \
    report_on instance-trs-top-level.jsonld

show "expectation met: the document is a TRS certificate: the TRS alone, at the top of the @graph" \
    report_on instance-trs-certificate.jsonld

show "expectation unmet: the TRS is defined as the object of trov:wasConductedBy" \
    report_on instance-trs-nested.jsonld

show "expectation unmet: the TRO refers to its TRS and nothing defines it" \
    report_on instance-trs-absent.jsonld

exit 0
