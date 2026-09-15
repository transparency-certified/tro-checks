#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

# cat -v shows each non-ASCII byte as M- notation, so the output stays ASCII: UTF-8 ü is M-CM-<, Latin-1 ü is M-|.
report_on() {
    cat -v "$1"
    echo
    check-tro --target SAFE-JSON --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 01: utf8-encoded (TIER 1 - SAFE-JSON)"

show "expectation met: Zürich is written in UTF-8" \
    report_on instance-utf8.jsonld

show "expectation unmet: Zürich is written in Latin-1, whose ü is not a UTF-8 sequence" \
    report_on instance-latin1.jsonld

exit 0
