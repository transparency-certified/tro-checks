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

title "tro-checks  ·  demo 23: context-aliases-absent (TIER 3 - TRACE-JSON-LD)"

show "expectation met: a term definition types its values and renames nothing" \
    report_on instance-typed-term.jsonld

show "expectation unmet: a term definition aliases a property name" \
    report_on instance-alias.jsonld

show "expectation unmet: a term definition holds more than a @type" \
    report_on instance-language-in-term.jsonld

exit 0
