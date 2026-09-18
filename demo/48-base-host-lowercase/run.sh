#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target LINKABLE-TRO --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 48: base-host-lowercase (TIER 5 - LINKABLE-TRO)"

show "expectation met: the @base host is lowercase" \
    report_on instance-lowercase-host.jsonld

show "expectation unmet: the host carries a capital, so DNS sees one namespace and RDF sees two" \
    report_on instance-uppercase-host.jsonld

exit 0
