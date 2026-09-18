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

title "tro-checks  ·  demo 37: times-zoned (TIER 4 - STANDALONE-TRO)"

show "expectation met: both times carry Z" \
    report_on instance-times-zoned.jsonld

show "expectation met: a time carries an offset, -07:00" \
    report_on instance-time-with-offset.jsonld

show "expectation met: schema:dateCreated has no zone, which this expectation does not judge" \
    report_on instance-date-created-unzoned.jsonld

show "expectation unmet: trov:startedAtTime has no zone" \
    report_on instance-time-unzoned.jsonld

exit 0
