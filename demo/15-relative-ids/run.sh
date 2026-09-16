#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target SAFE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 15: relative-ids-plain (TIER 2 - SAFE-JSON-LD)"

show "expectation met: relative ids are plain paths; absolute, compact and blank node ids are not relative" \
    report_on instance-plain-relative-ids.jsonld

show "expectation unmet: a relative @id begins with /" \
    report_on instance-leading-slash.jsonld

show "expectation unmet: relative @ids have . and .. segments" \
    report_on instance-dot-segments.jsonld

show "expectation unmet: relative @ids carry a query and a fragment" \
    report_on instance-query-and-fragment.jsonld

show "expectation unmet: a relative @id begins with @" \
    report_on instance-keyword-like-id.jsonld

exit 0
