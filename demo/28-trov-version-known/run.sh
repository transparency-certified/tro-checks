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

title "tro-checks  ·  demo 28: trov-version-known (TIER 4 - STANDALONE-TRO)"

show "expectation met: the TRO declares trov:vocabularyVersion "0.1"" \
    report_on instance-version-0-1.jsonld

show "expectation unmet: the TRO declares no trov:vocabularyVersion" \
    report_on instance-no-version.jsonld

show "expectation unmet: the version is the number 0.1, not a string" \
    report_on instance-version-number.jsonld

show "expectation unmet: the declared version is 0.2, which the checker does not know" \
    report_on instance-version-0-2.jsonld

exit 0
