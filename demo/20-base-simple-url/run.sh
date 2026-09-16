#!/usr/bin/env bash

source "${REPRO_MNT}/demo/cells.sh"

mkdir -p tmp

report_on() {
    cat "$1"
    echo
    check-tro --target TRACE-JSON-LD --compact --candidate "$1" --report "tmp/${1%.jsonld}.md"
    echo
    cat "tmp/${1%.jsonld}.md"
}

title "tro-checks  ·  demo 20: base-simple-url (TIER 3 - TRACE-JSON-LD)"

show "expectation met: the @base is a simple URL" \
    report_on instance-https-base.jsonld

show "expectation unmet: the @base names no host" \
    report_on instance-base-without-host.jsonld

show "expectation unmet: the @base carries a user name and password" \
    report_on instance-base-with-userinfo.jsonld

show "expectation unmet: the @base has a .. segment" \
    report_on instance-base-with-dot-segments.jsonld

show "expectation unmet: the @base has a query" \
    report_on instance-base-with-query.jsonld

show "expectation unmet: the @base does not end in /" \
    report_on instance-base-without-slash.jsonld

show "expectation unmet: the @base contains a space and a malformed percent escape" \
    report_on instance-base-with-illegal-characters.jsonld

exit 0
