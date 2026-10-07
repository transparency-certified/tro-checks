#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target-tier DEFINES-TRS --target-version trace-0.1 --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 49: capability-terms-known (Tier 5 - DEFINES-TRS)"

show "expectation met: the capability is a reference to the TROV term trov:CanProvideInternetIsolation" \
    report_on instance-capability-trov-term.jsonld

show "expectation unmet: the capability is a node of its own, with an @id and an @type, not a reference to a term" \
    report_on instance-capability-node.jsonld

show "expectation unmet: the capability refers to the relative id trs/capability/0" \
    report_on instance-capability-relative.jsonld

show "expectation unmet: the capability refers to trov:CanIsolateNetwork, which TROV does not define" \
    report_on instance-capability-unknown.jsonld

exit 0
