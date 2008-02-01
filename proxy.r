#!/usr/local/bin/rebol -cs

REBOL []

;print "Content-type: text/plain^/"

do %json.r

cache-mode: true

cgi: system/options/cgi
query-string: cgi/query-string
params: make object! decode-cgi query-string

cache: %/tmp/rss-box/
make-dir cache
file: join cache enbase params/url

referrer: select cgi/other-headers "HTTP_REFERER"
if not none? referrer [
   log: join cache "access.log"
   referrers: either exists? log [ load log ] [ make block! 50 ]
   insert referrers referrer 
   save log copy/part referrers 50
]

either all [cache-mode exists? file (difference now modified? file) < 00:05] [
   source: read file
] [
	if error? result: try [
	   connection: open to-url params/url
	   ;mime: connection/locals/headers/Content-Type
	   source: copy connection
	   if any [none? source find source "<error>"] [
	      make error! "I am afraid, Dave."
	   ]
	   close connection
	   true
	] [
	   source: read %error.tmpl
	   replace source "${home}" "?"
	   replace/all source "${url}" params/url
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
   param: params
   xml: source
   modified: to-idate (modified? file) 
]

print "Content-Type: text/javascript^/"
print rejoin ["org = {p3k: " to-json data "};^/"]
print read %rss-box.js
