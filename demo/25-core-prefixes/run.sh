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

title "tro-checks  ·  demo 25: core-prefixes-pinned (TIER 4 - STANDALONE-TRO)"

show "expectation met: the core prefixes map to their Declaration Format namespaces" \
    report_on instance-core-prefixes.jsonld

show "expectation unmet: trov maps to another version's namespace, so every trov: check below is not assessed" \
    report_on instance-trov-other-version.jsonld

show "expectation unmet: schema maps to the http namespace" \
    report_on instance-schema-http.jsonld

show "expectation unmet: the @context declares no trov prefix, though the TRO is typed by its full IRI" \
    report_on instance-trov-undeclared.jsonld

show "expectation unmet: a second prefix maps to the TROV namespace, hiding TROV terms from every trov: check" \
    report_on instance-second-trov-prefix.jsonld

exit 0
