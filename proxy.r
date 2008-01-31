#!/usr/local/bin/rebol -cs

REBOL []

;print "Content-type: text/plain^/"

cgi: system/options/cgi
query-string: cgi/query-string

url: to-url dehex query-string

connection: open url
source: copy connection
mime: connection/locals/headers/Content-Type
close connection

print rejoin ["Content-type: " either none? mime ["text/plain"] [mime] crlf]
print source

quit



probe connection/locals/headers
probe mime
