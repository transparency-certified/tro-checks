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

title "tro-checks  ·  demo 19: base-web-scheme (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the @base uses the https scheme" \
    report_on instance-https-base.jsonld

show "expectation unmet: the @base is a urn:uuid URI" \
    report_on instance-urn-base.jsonld

show "expectation unmet: the @base is a number" \
    report_on instance-number-base.jsonld

exit 0
