#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target USES-TROV-CORRECTLY --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 31: times-iso-8601 (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: the times are ISO 8601 date-times, one with a fraction of a second" \
    report_on instance-times-iso-8601.jsonld

show "expectation met: schema:dateCreated is a date alone, which schema.org allows" \
    report_on instance-date-created-date-only.jsonld

show "expectation unmet: a time separates date and time with a space, not T" \
    report_on instance-time-with-space.jsonld

show "expectation unmet: schema:dateCreated is written in prose" \
    report_on instance-date-created-prose.jsonld

exit 0
