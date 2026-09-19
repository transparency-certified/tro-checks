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

title "tro-checks  ·  demo 30: mime-types-two-part (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: the artifacts carry text/plain and application/x-python" \
    report_on instance-mime-types-two-part.jsonld

show "expectation unmet: a MIME type is the single name text" \
    report_on instance-mime-type-one-part.jsonld

show "expectation unmet: a MIME type carries a parameter" \
    report_on instance-mime-type-with-parameter.jsonld

exit 0
