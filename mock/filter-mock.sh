#!/usr/bin/env bash

cat ./mock.json  |\
 jq 'del(..|objects|.html)' |\
 jq 'del(..|objects|.avatarUrls)' \
 > ./mock1.json
