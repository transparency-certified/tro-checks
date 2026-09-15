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

title "tro-checks  ·  demo 04: lone-surrogates-absent (TIER 1 - SAFE-JSON)"

show "expectation met: an emoji escaped as a surrogate pair" \
    report_on instance-paired-surrogates.jsonld

show "expectation unmet: a string ends with the first half of a surrogate pair" \
    report_on instance-lone-surrogate-in-string.jsonld

show "expectation unmet: a member name contains the second half of a surrogate pair" \
    report_on instance-lone-surrogate-in-member-name.jsonld

exit 0
