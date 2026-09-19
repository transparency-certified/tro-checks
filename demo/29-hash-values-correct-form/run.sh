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

title "tro-checks  ·  demo 29: hash-values-correct-form (TIER 4 - USES-TROV-CORRECTLY)"

show "expectation met: sha256, sha512 and blake2b values, lowercase hexadecimal of 64, 128 and 128 digits" \
    report_on instance-correct-forms.jsonld

show "expectation unmet: a sha256 value is the placeholder aaa1..." \
    report_on instance-placeholder.jsonld

show "expectation unmet: a sha256 value is written in uppercase" \
    report_on instance-uppercase.jsonld

show "expectation unmet: a sha512 value has 64 digits, not 128" \
    report_on instance-sha512-too-short.jsonld

exit 0
