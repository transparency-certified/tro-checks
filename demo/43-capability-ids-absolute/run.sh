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

title "tro-checks  ·  demo 43: capability-ids-absolute (TIER 5 - DEFINES-TRS)"

show "expectation met: the capability is identified by an absolute IRI" \
    report_on instance-capability-absolute.jsonld

show "expectation unmet: the capability is identified by the relative id trs/capability/0" \
    report_on instance-capability-relative.jsonld

exit 0
