#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier USES-TROV-CORRECTLY --target-version trace-main --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 40: creators-person-or-organization (Tier 4 - USES-TROV-CORRECTLY)"

show "expectation met: schema:creator is an Organization node" \
    report_on instance-creator-organization.jsonld

show "expectation met: schema:creator is a bare reference" \
    report_on instance-creator-reference.jsonld

show "expectation unmet: schema:creator is a string" \
    report_on instance-creator-string.jsonld

show "expectation unmet: schema:creator is typed schema:Thing" \
    report_on instance-creator-thing.jsonld

exit 0
