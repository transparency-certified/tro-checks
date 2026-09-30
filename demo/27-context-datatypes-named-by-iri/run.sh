#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target TRACE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 27: context-datatypes-named-by-iri (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the datatype is named by a full IRI" \
    report_on instance-datatype-iri.jsonld

show "expectation unmet: the datatype is given as the keyword @vocab" \
    report_on instance-datatype-keyword.jsonld

exit 0
