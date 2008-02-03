#!/usr/local/bin/rebol -cs

REBOL []

print "Content-Type: text/javascript^/"

do %json.r

cache-mode: true

cgi: system/options/cgi
query-string: cgi/query-string
params: make object! decode-cgi query-string

cache: %/tmp/rss-box/
make-dir cache
file: join cache enbase/base to-string checksum params/url 16
lock-file: join cache %locked

lock: func [] [
   loop 10 [
      if not exists? lock-file [
         save lock-file null
         return true
      ]
      wait (random 10) / 100
   ]
   return false
]

unlock: func [] [
   if exists? lock-file [
      delete lock-file
      return true
   ]
   return false
]

if lock [
	referrer: select cgi/other-headers "HTTP_REFERER"
	if not none? referrer [
	   log: join cache "access.log"
	   referrers: either exists? log [ load log ] [ make block! 50 ]
	   insert referrers referrer 
	   save log copy/part referrers 50
	]
	unlock
]

data: make object! [
   xml: null
   query: query-string
   param: params
   message: null
   modified: null
   box: read %box.tmpl
   image: read %image.tmpl
   input: read %input.tmpl
   item: read %item.tmpl
   date: read %date.tmpl
   link: read %link.tmpl
   error: read %error.tmpl
]

either all [cache-mode exists? file (difference now modified? file) < 00:05] [
   set in data 'xml read file
   set in data 'modified to-idate (modified? file) 
   comment [ FIXME: Conditional GET would be nice but it does not work this way:
      print "Status: 304 Not Modified"
      print join "Date: " to-idate (modified? file)
      print newline
      quit
   ]
] [
	if error? result: try [
      connection: open to-url params/url
      source: copy connection
      close connection
      ;; FOR DEBUGGING:
      ;replace source {<channel} {<chaxnel}
      set in data 'xml source
      true
   ] [
      source: null
      set in data 'message get in disarm result 'arg1
	]
 	write file source
]

print rejoin ["var org = {p3k: " to-json data "};^/"]
print read %main.js
