#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target SAFE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 09: context-at-root-only (TIER 2 - SAFE-JSON-LD)"

show "expectation met: the only @context is the root's" \
    report_on instance-context-at-root.jsonld

show "expectation unmet: a node carries an @context of its own" \
    report_on instance-context-in-node.jsonld

show "expectation unmet: a term definition carries a scoped @context" \
    report_on instance-scoped-context.jsonld

exit 0
