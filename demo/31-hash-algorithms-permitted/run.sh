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

title "tro-checks  ·  demo 31: hash-algorithms-permitted (TIER 4 - STANDALONE-TRO)"

show "expectation met: the hashes name sha256, sha512 and sha3-256" \
    report_on instance-permitted-algorithms.jsonld

show "expectation unmet: an artifact carries an md5 hash, which TRACE does not permit, beside its sha256" \
    report_on instance-md5-beside-sha256.jsonld

show "expectation unmet: the algorithm is spelled SHA-256, which is not the permitted spelling" \
    report_on instance-algorithm-misspelled.jsonld

show "expectation unmet: a hash names no algorithm" \
    report_on instance-hash-without-algorithm.jsonld

exit 0
