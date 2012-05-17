#!/bin/bash

echo -n "Compressing files... "

#java -jar /opt/htmlcompressor-1.5.3.jar -t html --compress-js --compress-css templates.raw.txt > templates.txt

compress="java -jar /opt/yuicompressor-2.4.7.jar"
#compress="cat"

cp jquery.min.js index.js
cp index.js main.js

cat jquery.ba-bbq.min.js >> index.js
$compress index.raw.js >> index.js

cat jquery.miniColors.min.js >> main.js
$compress main.raw.js >> main.js

$compress jquery.miniColors.css > main.css
$compress main.raw.css >> main.css

echo done.
