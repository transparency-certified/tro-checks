#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target TRACE-PERMISSIBLE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 27: context-assigns-only-datatypes-to-properties (TIER 3 - TRACE-PERMISSIBLE-JSON-LD)"

show "expectation met: the @context assigns a property only a datatype" \
    report_on instance-datatype-only.jsonld

show "expectation unmet: the @context assigns a property a language" \
    report_on instance-language-in-term.jsonld

exit 0
