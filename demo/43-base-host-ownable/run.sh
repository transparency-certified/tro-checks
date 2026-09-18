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

title "tro-checks  ·  demo 43: base-host-ownable (TIER 5 - LINKABLE-TRO)"

show "expectation met: the host is a name its minter could hold" \
    report_on instance-ownable-host.jsonld

show "expectation unmet: example.org is reserved for documentation and can never be held" \
    report_on instance-documentation-host.jsonld

show "expectation unmet: a bare label names something only inside one network" \
    report_on instance-bare-label-host.jsonld

exit 0
