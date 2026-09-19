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

title "tro-checks  ·  demo 49: gpg-signing-key-present (TIER 6 - STANDALONE-TRO)"

show "expectation met: the TRO is signed with trov:GPGSigning and its TRS carries a public key" \
    report_on instance-gpg-with-key.jsonld

show "expectation met: the TRO is signed with trov:X509CMSSigning and its TRS carries no key" \
    report_on instance-x509-without-key.jsonld

show "expectation unmet: the TRO is signed with trov:GPGSigning and its TRS carries no key" \
    report_on instance-gpg-without-key.jsonld

exit 0
