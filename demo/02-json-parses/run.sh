#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target SAFE-JSON --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

report_at_trace_json_ld_on() {
    cat "$1"
    echo
    check-tro --target TRACE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}-at-trace-json-ld.md"
    echo
    cat "tmp/${1%.jsonld}-at-trace-json-ld.md"
}

title "tro-checks  ·  demo 02: json-parses (TIER 1 - SAFE-JSON)"

show "expectation met: the candidate is a JSON object" \
    report_on instance-object.jsonld

show "expectation met: the candidate is a JSON number, which is JSON though not JSON-LD" \
    report_on instance-number.jsonld

show "expectation unmet: the candidate is a bare word" \
    report_on instance-bare-word.jsonld

show "expectation unmet: an array ends with a trailing comma" \
    report_on instance-trailing-comma.jsonld

show "expectation unmet, targeting TRACE-JSON-LD: the tiers above SAFE-JSON are not assessed" \
    report_at_trace_json_ld_on instance-bare-word.jsonld

exit 0
