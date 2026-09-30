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

title "tro-checks  ·  demo 55: created-with-single-tool (TIER 6 - STANDALONE-TRO)"

show "expectation met: the software tool that generated the declaration is named by reference" \
    report_on instance-created-with-single.jsonld

show "expectation unmet: trov:createdWith names two tools in an array" \
    report_on instance-created-with-array.jsonld

show "expectation unmet: the tool is named by a string" \
    report_on instance-created-with-string.jsonld

exit 0
