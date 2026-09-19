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

title "tro-checks  ·  demo 44: capability-warrants-absolute (TIER 5 - DEFINES-TRS)"

show "expectation met: the performance attribute's warrant refers to the capability by absolute IRI" \
    report_on instance-warrant-absolute.jsonld

show "expectation unmet: the warrant refers to the capability by the relative id trs/capability/0" \
    report_on instance-warrant-relative.jsonld

exit 0
