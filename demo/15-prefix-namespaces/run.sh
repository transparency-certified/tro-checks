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

title "tro-checks  ·  demo 15: prefix-namespaces-terminated (TIER 3 - TRACE-JSON-LD)"

show "expectation met: every prefix maps to an absolute IRI ending in # or /" \
    report_on instance-terminated-namespaces.jsonld

show "expectation unmet: the ex prefix's namespace ends in neither # nor /" \
    report_on instance-unterminated-namespace.jsonld

show "expectation unmet: the ex prefix maps to a relative IRI" \
    report_on instance-relative-namespace.jsonld

show "expectation unmet: the core schema prefix's namespace lacks its final /" \
    report_on instance-core-prefix-unterminated.jsonld

exit 0
