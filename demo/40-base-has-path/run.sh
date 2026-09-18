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

title "tro-checks  ·  demo 40: base-has-path (TIER 5 - LINKABLE-TRO)"

show "expectation met: the @base names something below the host" \
    report_on instance-base-with-path.jsonld

show "expectation unmet: the @base is the host alone, which every TRO of that system would share" \
    report_on instance-base-host-only.jsonld

exit 0
