#!/usr/local/bin/rebol -cs

REBOL []

;print "Content-type: text/plain^/"

do %json.r

cgi: system/options/cgi
query-string: cgi/query-string
url: to-url dehex query-string

cache: %/tmp/rss-box/
make-dir cache
file: join cache enbase url

either all [exists? file (difference now modified? file) < 00:01] [
   source: read file 
   mime: "application/rss+xml"
] [
	if error? result: try [
	   connection: open url
	   source: copy connection
	   if any [none? source find source "<error>"] [
	      make error! "I am afraid, Dave."
	   ]
	   mime: connection/locals/headers/Content-Type
	   close connection
	   true
	] [
	   mime: "application/rss+xml"
	   source: read %error.tmpl
	   replace source "${home}" "?"
	   replace/all source "${url}" url
	   replace source "${message}" get in disarm result 'arg1
	]
	write file source
]

data: make object! [
   box: read %box.tmpl
   image: read %image.tmpl
   input: read %input.tmpl
   item: read %item.tmpl
   date: read %date.tmpl
   link: read %link.tmpl
]

print rejoin ["X-RssBox-Data: " to-json data]
print rejoin ["Content-type: " any [mime "text/plain"] crlf]
print source

quit

probe connection/locals/headers
probe mime
