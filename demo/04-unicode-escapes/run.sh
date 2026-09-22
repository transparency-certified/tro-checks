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

title "tro-checks  ·  demo 04: unicode-escapes-spell-whole-characters (TIER 1 - SAFE-JSON)"

show "expectation met: an emoji written as the two escapes that spell it" \
    report_on instance-paired-surrogates.jsonld

show "expectation unmet: a string ends with an escape spelling half a character" \
    report_on instance-lone-surrogate-in-string.jsonld

show "expectation unmet: a member name holds an escape spelling half a character" \
    report_on instance-lone-surrogate-in-member-name.jsonld

exit 0
