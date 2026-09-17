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

title "tro-checks  ·  demo 28: base-declared (TIER 5 - LINKABLE-TRO)"

show "expectation met: the @context declares an @base" \
    report_on instance-base-declared.jsonld

show "expectation unmet: the @context declares no @base" \
    report_on instance-no-base.jsonld

exit 0
