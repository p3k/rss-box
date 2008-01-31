#!/usr/local/bin/rebol -cs

REBOL []

;print "Content-type: text/plain^/"

to-json: func [source /local result key] [
   switch type?/word source [
      object! [
         keys: first source
         result: "({"
         for i 2 length? keys 1 [
            key: pick keys i
            result: rejoin [result {'} key {':} to-json get in source key {,}]
         ] 
         result: join result "})"
         print result
      ]
      
      string! [
         replace/all source lf "\n"
         replace/all source {"} {\"}
         result: rejoin [{(String("} source {"))}]
      ]
      
      integer! [result: source]
   ]
   return result
]

cgi: system/options/cgi
query-string: cgi/query-string

url: to-url dehex query-string

connection: open url
source: copy connection
mime: connection/locals/headers/Content-Type
close connection

data: make object! [
   box: read %box.tmpl
   image: read %image.tmpl
   input: read %input.tmpl
   item: read %item.tmpl
   date: read %date.tmpl
]

print rejoin ["X-RssBox-Data: " to-json data]
print rejoin ["Content-type: " any [mime "text/plain"] crlf]
print source

quit



probe connection/locals/headers
probe mime
