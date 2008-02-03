#!/usr/local/bin/rebol -cs

REBOL []

do %json.r

print "Content-Type: text/javascript^/"
print to-json make object! [referrers: load %/tmp/rss-box/access.log]
