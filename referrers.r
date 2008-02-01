#!/usr/local/bin/rebol -cs

REBOL []

do %json.r

print "Content-Type: text/javascript^/"
print to-json make object! [referrers: load %/tmp/rss-box/access.log]

quit

cache: %/tmp/rss-box/

files: sort/compare read cache func [a b] [ 
   (modified? join cache a) > modified? join cache b
]

list: make block! 50

foreach file files [
   append list to-string debase file
   if (length? list) = 50 [break]
]

print "Content-Type: text/javascript; UTF-8^/"
print to-json make object! [referrers: list]
