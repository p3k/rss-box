#!/usr/bin/rebol -cs

; original usertalk call:
; viewRssBox(url, boxTitle, align, width, frameColor, titleBarTextColor, \
; titleBarColor, boxFillColor, timeZone, hspace, vspace, maxItems)

REBOL [
   Title:   "JavaScript RSS-Box Viewer"
   Date:    19-Mar-2001
   Name:    copy Title  ; For window title bar

   Version: 1.0.0
   File:    %rss-box.r
   Home:    http://forever.p3k.org/rss

   Author:  "Tobi Schaefer"
   Owner:   "p3k organisation"
   Rights:  "Copyright (C) p3k organisation 2003"

   Needs:   [
      %xml-lib.r
      %error.skin 
      %box.skin 
      %setup.skin 
      %textInput.skin 
      %image.skin 
      %item.skin 
      %javascript.skin
   ]

   Tabs:    3

   Purpose: {This viewer fetches XML files in RSS format from a URL and displays it as HTML box. The output is cached and then fetched from cache for one hour before it is fetched from URL again. Depending on the setting of the "javascript" variable in a HTTP query the output is formatted in plain HTML code or wrapped in JavaScript "document.write" lines. The "setup" variable defines whether the plain HTML output comes along with a display of information about the RSS channel and a form to define the properties of the box layout.}

   Note: {}

   History: [
      0.1.0 [19-Mar-2001 "Created this script" "ts"]
      0.2.0 [ 8-Apr-2001 "Added support for RSS 1.0" "ts"]
      0.3.0 [ 6-May-2001 "Fixed URLs from newsisfree.com" "ts"]
      0.4.0 [30-May-2001 "Fixed a bug that caused diacritic characters to be displayed as entity codes" "ts"]
      0.5.0 [ 1-Jun-2001 "Fixed support for RSS 0.92 with missing titles" "ts"]
      0.6.0 [ 8-Aug-2001 "Fixed a bug that corrupted URLs containing a query" "ts"]
      0.7.0 [15-Aug-2001 "Fixed a bug that caused files older than one hour to be read from cache" "ts"]
      0.7.1 [16-Aug-2001 "Rewrote caching system using base64 encoded file names" "ts"]
      0.8.0 [24-Aug-2001 "Added item delimiter" "ts"]
      0.9.0 [31-Aug-2001 "Added CSS classes .rssBoxTitle and .rssBoxContent" "ts"]
      0.9.1 [ 3-Sep-2001 "Added CSS classes .rssBoxItemTitle and .rssBoxItemContent" "ts"]
      0.9.2 [ 4-Sep-2001 "Added support for XML button; added icons for enclosure and source" "ts"]
      0.9.5 [21-Sep-2001 "Implemented support for textinput; fixed timezone display; fixed a bug that caused unnecessary information in query string of the generated JavaScript tag" "ts"]
      0.9.6 [29-Oct-2001 {Changed cache mechanism from base64 to base16 due to slashes in the based string; additionally, #"^/" chars need to be replaced in base16 strings. Added default dots ("...") for short-url.} "ts"]
      0.9.7 [17-Nov-2001 {Added checkbox to enable a "compact" view on the RSS channel - if an item's title is defined the description will be dropped, just as the channel image is not displayed; added support for some dublin core tags in RSS 1.0} "ts"]
      0.9.8 [12-Feb-2002 {Corrected parent of textinput element (ie. rss, was channel)} "ts"]
      0.9.9 [26-Jan-2004 {Rewrote whole application from scratch using object-oriented approach.} "ts"]
      1.0.0 [28-Jan-2004 {Added output of "error" box if something goes wrong. Labeled as release candidate} "ts"]
   ]

   Language: 'English
]

;; uncomment the following line for debugging
;print "Content-type: text/plain^/"

rss-box-viewer: make object! [
   baseuri: "http://forever.p3k.org/rss2/"

   defaults:  make object! [
      url: "http://blog.p3k.org/rss"
      align: "left"
      width: "200"
      frameColor: "darkgray"
      titleBarColor: "lightblue"
      titleBarTextColor: "black"
      boxFillColor: "white"
      textColor: "black"
      fontFace: ""
      maxItems: "7"
      showXmlButton: ""
      compact: ""
      setup: "false"
      javascript: "false"
      cache: "true"
   ]

   get-id: func [ /local url id] [
      url: copy settings/url
      replace url "http://" ""
      id: copy/part enbase/base url 16 256
      replace/all id #"^/"
      return id
   ]

   get-filename: func [ /local fname] [
      fname: first parse last parse settings/url "/" "?"
      if empty? fname [ fname: "..." ]
      return fname
   ]

   get-source: func [ /local src] [
      if not (settings/cache = "false") and exists? cache [
         modify-time: modified? cache
         if all [
            (now - modify-time) < 1
            (difference now modified? cache) < 1:00
         ][
            print "<!-- read from cache -->"
            return decompress read/binary cache
         ]
      ]
      if not (find settings/url http://) = settings/url [
         insert settings/url http://
      ]
      if error? try [
         src: read settings/url
      ][
         msg: "Sorry, could not read from url"
         return make string! 0 
      ]
      print "<!-- fetch from url -->"
      write/binary cache compress src
      return src
   ]

   parse-date: func [str [string!]] [
      if empty? str [
         return none
      ]
      if error? try [    
         return to-date str
      ][
         if error? try [
            return parse-header-date str
         ][
            return none
         ]
      ]
      return none
   ]

   to-utc-date: func [date [date!] /local utc-date] [
      utc-date: date - date/zone
      utc-date/zone: 0:00
      return utc-date
   ]

   format-date: func [date [date!] format [string!]] [
      result: make string! 32
      foreach ch format [
         pairs: reduce [
            #"y" date/year
            #"M" date/month
            #"d" date/day
            #"H" date/time/hour
            #"m" date/time/minute
            #"s" date/time/second
            #"Z" date/zone
         ]
         value: reduce select/case pairs ch
         append result either none? value [ch][
            join either value < 10 [0][""] value
         ]
      ]
      return result
   ]

   init-settings: func [ /local cgi query-string] [
      cgi: system/options/cgi
      query-string: cgi/query-string
      if any [none? query-string empty? query-string] [
         print rejoin ["Location: " baseuri "?setup=true^/"]
      ]
      query-data: make object! decode-cgi query-string
      foreach key next first defaults [
         custom-value: either in query-data key [
            get in query-data key
         ][
            make string! 0
         ]
         set in settings key either empty? custom-value [
            get in defaults key
         ][
            custom-value
         ]      
      ]
      settings/url: to-url settings/url
      return
   ]

   get-data: func [rss] [
      data: make object! [
         channel: title: description: link: version: none
         version: xml/get-attribute rss "version"
         format: switch (xml/get-label rss) [
            "rss" ["RSS"]
            "rdf:RDF" ["RDF"]
            "scriptingNews" ["Scripting News"]
         ]
         either format = "Scripting News" [
            channel: xml/get-element rss "header"
            title: xml/get-content channel "channelTitle"
            description: xml/get-content channel "channelDescription"
            link: xml/get-content channel "channelLink"
            version: xml/get-content channel "scriptingNewsVersion"
         ][
            channel: xml/get-element rss "channel"
            title: xml/get-content channel "title"
            description: xml/get-content channel "description"
            link: xml/get-content channel "link"
         ]
         pubDate: parse-date xml/get-content channel "pubDate"
         lastBuildDate: parse-date xml/get-content channel "lastBuildDate"
         if none? lastBuildDate [
            lastBuildDate: xml/get-content channel "dc:date"
            either empty? lastBuildDate [
               lastBuildDate: now
            ][
               replace lastBuildDate "T" "/"
               lastBuildDate: parse-date lastBuildDate
            ]
         ]
         copyright: xml/get-content channel "copyright"
         if empty? copyright
            [copyright: xml/get-content channel "dc:rights"]
         managingEditor: xml/get-content channel "managingEditor"
         if empty? managingEditor
            [managingEditor: xml/get-content channel "dc:creator"]
         webMaster: xml/get-content channel "webMaster"
         rating: xml/get-content channel "rating"
         skipDays: xml/get-content channel "skipDays"
         skipHours: xml/get-content channel "skipHours"
         text-input: make object! [
            element: xml/get-element rss "textinput"
            link: description: name: title: none
            if not empty? element [
               link: xml/get-content element "link"
               description: xml/get-content element "description"
               name: xml/get-content element "name"
               title: xml/get-content element "title"
            ]
         ]
         image: make object! [
            title: url: link: width: height: description: none
            either format = "scriptingNews" [
               title: xml/get-content channel "imageTitle"
               url: xml/get-content channel "imageUrl"
               link: xml/get-content channel "imageLink"
               width: xml/get-content channel "imageWidth"
               height: xml/get-content channel "imageHeight"
               description: xml/get-content channel "imageCaption"
            ][
               element: xml/get-element channel "image"
               if format = "RDF" [element: xml/get-element rss "image"]
               title: xml/get-content element "title"
               url: xml/get-content element "url"
               link: xml/get-content element "link"
               width: xml/get-content element "width"
               height: xml/get-content element "height"
               description: xml/get-content element "description"
            ]
         ]
         items: make block! 100
         element: either format = "RSS" [
            xml/get-element channel "item"
         ][
            xml/get-element rss "item"
         ]
         foreach [label attr child] element [
            item: make object! [
               description: title: link: none
               source: make object! [
                  link: title: none
                  use [src][
                     src: xml/get-element child "source"
                     if not empty? src [
                        link: xml/get-attribute src "url"
                        title: (xml/get-content src)
                     ]
                  ]
               ]
               enclosure: make object! [
                  link: length: type: none
                  use [enc][
                     enc: xml/get-element child "enclosure"
                     if not empty? enc [
                        link: xml/get-attribute enc "url"
                        length: xml/get-attribute enc "length"
                        type: xml/get-attribute enc "type"
                     ]
                  ]
               ]
               category: make object! [
                  domain: content: none
                  use [cat][
                     cat: xml/get-element child "category"
                     if not empty? cat [
                        domain: xml/get-attribute cat "domain"
                        content: xml/get-attribute cat "content"
                     ]
                  ]
               ]
               either format = "Scripting News" [
                  description: xml/get-content child "text"
                  use [link linetext url] [
                     link: xml/get-element child "link"
                     foreach [label attr item] link [
                        linetext: xml/get-content item "linetext"
                        url: xml/get-content item "url"
                        replace/case description linetext rejoin [
                           {<a href="} url {">} linetext "</a>"
                        ]
                     ]
                  ]
               ][
                  description: xml/get-content child "description"
                  title: xml/get-content child "title"
                  link: xml/get-content child "link"
               ]
            ]
            append items item
         ]
      ]
      return data
   ]

   render-template: func [
      template-file [file!]
      param [object!]
      /local newstr result macrolist
   ][
      template: read template-file
      result: copy template
      macrolist: make block! 20
      parse result [
         any [
            to "<%" copy macro [thru "<%" "param." copy title to " " thru "%>"]
            (append macrolist reduce [title macro])
         ]
      ]
      foreach [title macro] macrolist [
         newstr: get in param to-word title
         if none? newstr [newstr: ""]
         if not empty? to-string newstr [
            parts: parse macro "="
            display: select parts "display"
            either not none? display [
               newstr: display
            ][
               prefix: select parts "prefix"
               suffix: select parts "suffix"
               if not none? prefix [insert newstr prefix]
               if not none? suffix [append newstr suffix]
            ]
         ]
         replace/all result macro newstr
      ]
      return result
   ]

   render: func [ /local item description] [
      return render-template %box.skin make settings [
         image: xmlButton: textInput: none
         link: data/link
         description: data/description
         boxTitle: data/title
         lastBuildDate: format-date to-utc-date data/lastBuildDate "y-M-d, H:m"
         if settings/showXmlButton = "1" [
            settings/showXmlButton: {checked="checked"}
            xmlButton: render-template %image.skin make object! [
               link: settings/url
               source: join baseuri "xml.gif" border: "0"
               width: "36" height: "14" align: "right" valign: "top" 
               title: "Click here to see the XML version of this channel."
            ]
         ]
         content: make string! 50000
         if error? try [
            max: to-integer settings/maxItems
         ][
            max: to-integer defaults/maxItems
         ]
         for n 1 (minimum max length? data/items) 1 [
            item: first at data/items n
            if all [not empty? settings/compact not empty? item/title] [
               clear item/description
            ]
            append content render-template %item.skin make item [
               enclosure: source: make string! 256
               if not none? item/enclosure/link [
                  enclosure: render-template %image.skin make item/enclosure [
                     source: join baseuri "enclosure.gif"
                     width: height: "15"
                     title: item/enclosure/type
                  ]
               ]
               if not none? item/source/link [
                  source: render-template %image.skin make item/source [
                     source: join baseuri "source.gif"
                     width: height: "15"
                  ]
               ]
               buttons: rejoin [enclosure " " source]
            ]
         ]
         either empty? settings/compact [
            if not none? data/text-input/link [
               textInput: render-template %textInput.skin data/text-input
            ]
            if not empty? data/image/url [
               image: render-template %image.skin data/image
            ]
         ][
            settings/compact: {checked="checked"}
         ]
      ]
   ]

   render-setup: func [str [string!] /local description] [      
      return render-template %setup.skin make settings [
         box: str
         title: data/title
         description: data/description
         lastBuild: format-date to-utc-date data/lastBuildDate "y-M-d, H:m"
         filename: get-filename
         format: data/format
         version: data/version
         contact: data/managingEditor
         javascript: render-template %javascript.skin make settings [
            baseuri: rss-box-viewer/baseuri
         ]
         replace/all javascript "#" "%23"
      ]
   ]

   js-print: func [str [string!]][
      lines: parse/all str "^/"
      pairs: ["^-" "" "^/" "" "^'" "&quot;"]
      foreach line lines [
         foreach [needle newstr] pairs [
            replace/all line needle newstr
         ]  
         prin rejoin ["document.writeln('" line "');^/"]
      ]
      return
   ]

   do %xml-lib.r
   xml: make xml-parser! []

   cache-dir: %cache/
   make-dir cache-dir
   settings: make defaults []
   init-settings

   either settings/javascript = "true" [
      print "Content-type: text/javascript^/"
      rebol-print: :print
      print: :js-print
   ][
      print "Content-type: text/html^/"
   ]

   id: get-id
   filename: get-filename
   cache: join cache-dir id
   source: get-source
   if empty? source [
      source: render-template %error.skin make object! [
         timestamp: to-utc-date now
         date: format-date timestamp "y-M-d"
         append date rejoin ["T" format-date timestamp "H-m" "Z"]
         url: baseuri
      ]
   ]
   document: xml/get-document source
   data: get-data (xml/get-element document)
]

dump: func [obj [object!]] [
   foreach key next first obj [
      print rejoin [key ": " get in obj key]
   ]
]

box: rss-box-viewer/render
print either rss-box-viewer/settings/setup = "true" [
   rss-box-viewer/render-setup box   
][
   box
]












comment [---------------

url: ""
rss-box-url: "http://piefke.helma.at/rss/rss-box.r?"

title: link: date: about: image-html: make string! 1000
content: make string! 5000

query-string: url: ""   
cgi: system/options/cgi
query-string: cgi/query-string
if not none? query-string [do decode-cgi query-string]

foreach [def value] defaults [
   if do join "not value? '" def [do rejoin [def ": " mold value]]
   if do join "empty? " def [do rejoin [def ": " mold value]]
]

url: to-url url ;either find/match url "http://" [to-url url][to-file url]
short-url: first parse last parse url "/" "?"
if empty? short-url [short-url: "..."]
fname: copy/part enbase/base url 16 256
replace/all fname #"^/"

rss-text: ""
cache-file: join %cache/ fname
message: "fetched from url"
if exists? cache-file [
   mod: modified? cache-file
   ;mod: modified? url
   ;if none? mod [mod: modified? cache-file]
   if not any [(now - mod) >= 1 (now/time - mod/time) >= 1:00][
      rss-text: read cache-file
      message: "fetched from cache"
   ]
]

if empty? rss-text [
   rss-text: read url
   write cache-file rss-text
]

; begin core...

document: get-xml-document rss-text
rss: (get-xml-element document)
version: get-xml-attribute rss "version"

format: switch (get-xml-label rss) [
   "rss" ["RSS"]
   "rdf:RDF" ["RDF"]
   "scriptingNews" ["scriptingNews"]
]

either format = "scriptingNews" [
   channel: get-xml-element rss "header"
   title: get-xml-content channel "channelTitle"
   about: get-xml-content channel "channelDescription"
   link: get-xml-content channel "channelLink"
   version: get-xml-content channel "scriptingNewsVersion"
][
   channel: get-xml-element rss "channel"
   title: get-xml-content channel "title"
   about: get-xml-content channel "description"
   link: get-xml-content channel "link"
]

pubDate: get-xml-content channel "pubDate"
lastBuildDate: get-xml-content channel "lastBuildDate"
if empty? lastBuildDate [
   lastBuildDate: get-xml-content channel "dc:date"
   if not empty? lastBuildDate [
      replace lastBuildDate "T" "/"
      lastBuildDate: to-idate to-date lastBuildDate
   ]
]

timezone: "GMT"
date: copy lastBuildDate
either empty? date [
   date: now
   time: date/time - date/zone
   if time < 0:00 [
      time: 24:00 + time
      date: date - 1
   ]
   date/zone: 0:00
][
   rev-date: copy date
   date: parse-header-date date
   reverse rev-date
   timezone: copy ""
   if error? try [
      foreach c rev-date [
         if (to-integer c) = 32 [break]
         timezone: join c timezone
         time: date/time
      ]
      c: first timezone
      if any [c = #"+" c = #"-"][
         timezone: "GMT"
         time: date/time - date/zone
         if time < 0:00 [
            time: 24:00 + time
            date: date - 1
         ]
         date/zone: 0:00
      ]
   ][]
]
time: to-string time
if (length? time) > 5 [time: copy/part time (length? time) - 3]
date: rejoin [date/day "." date/month "." date/year ", " time " " timezone]

copyright: get-xml-content channel "copyright"
if empty? copyright
   [copyright: get-xml-content channel "dc:rights"]

managingEditor: get-xml-content channel "managingEditor"
if empty? managingEditor
   [managingEditor: get-xml-content channel "dc:creator"]

webMaster: get-xml-content channel "webMaster"
rating: get-xml-content channel "rating"
skipDays: get-xml-content channel "skipDays"
skipHours: get-xml-content channel "skipHours"

input-form: copy ""
text-input: get-xml-element rss "textinput"
if not empty? text-input [
   input-form: {<form method="get" action="}
   append input-form get-xml-content text-input "link"
   append input-form {">^/}
   ti-description: get-xml-content text-input "description"
   if not empty? ti-description [
      append input-form join ti-description {<br>^/}
   ]
   append input-form {<input type="text" name="}
   append input-form get-xml-content text-input "name"
   append input-form {" size="15"> }
   append input-form {<input type="submit" value="}
   append input-form get-xml-content text-input "title"
   append input-form {">^/</form>}
]

image-html: make string! 500
either format = "scriptingNews" [
   image-title: get-xml-content channel "imageTitle"
   image-url: get-xml-content channel "imageUrl"
   image-link: get-xml-content channel "imageLink"
   image-width: get-xml-content channel "imageWidth"
   image-height: get-xml-content channel "imageHeight"
   image-description: get-xml-content channel "imageCaption"
][
   image: get-xml-element channel "image"
   if format = "RDF" [image: get-xml-element rss "image"]
   image-title: get-xml-content image "title"
   image-url: get-xml-content image "url"
   image-link: get-xml-content image "link"
   image-width: get-xml-content image "width"
   image-height: get-xml-content image "height"
   image-description: get-xml-content image "description"
]
if not empty? image-url [
   image-html: {<table border="0" cellspacing="0" cellpadding="10" align="right">}
   append image-html {<tr><td>}
   append image-html build-tag [a href (image-link) title (image-title)]
   append image-html rejoin [{<img src="} image-url {" border="0"}]
   if not empty? image-description [append image-html rejoin [{ alt="} image-description {"}]]
   if not empty? image-width [append image-html rejoin [{ width="} image-width {"}]]
   if not empty? image-height [append image-html rejoin [{ height="} image-height {"}]]
   append image-html {></a></td></tr></table>}
]

items: get-xml-element channel "item"
if format <> "RSS" [items: get-xml-element rss "item"]

content: make string! 10000
item-counter: 0
item-delimiter: to-integer maxItems
foreach [label attr item] items [
   item-counter: item-counter + 1
   
   append content {<p class="rssBoxItemContent">}
   
   news-source: get-xml-element item "source"
   if not empty? news-source [
      source-url: get-xml-attribute news-source "url"
      source-name: (get-xml-content news-source)
      append content build-tag [a href (source-url) title (source-name)]
      append content {&nbsp;<img src="http://publish.curry.com/rss/source.gif" width="15" height="15" border="0" align="left"></a>}
   ]

   enclosure: get-xml-element item "enclosure"
   if not empty? enclosure [
      encl-url: get-xml-attribute enclosure "url"
      encl-length: get-xml-attribute enclosure "length"
      encl-type: get-xml-attribute enclosure "type"
      append content build-tag [a href (encl-url) title "Click here to download this enclosure."]
      append content {<img src="http://publish.curry.com/rss/enclosure.gif" width="15" height="15" border="0" align="left"></a>}
   ]

   category: get-xml-element item "category"
   if not empty? category [
      cat-domain: get-xml-attribute category "domain"
      cat-content: (get-xml-content category)
      append content {&nbsp;&nbsp;&nbsp;[}
      append content build-tag [a href (join cat-domain cat-content)]
      append content {<small>category</small></a>]}
   ]

   either format = "scriptingNews" [
      description: get-xml-content item "text"
      sn-link: get-xml-element item "link"
      foreach [label2 attr2 item2] sn-link [
         sn-linetext: get-xml-content item2 "linetext"
         sn-link: get-xml-content item2 "url"
         replace/case description sn-linetext rejoin [
            {<a href="} sn-link {">} sn-linetext "</a>"
         ]
      ]
      append content description
   ][
      description: get-xml-content item "description"
      item-title: get-xml-content item "title"
      item-link: get-xml-content item "link"
      if not empty? item-title [
         ;if not empty? description [append content "<b>"]
         append content "<b>"
         if not empty? item-link [
            append content build-tag [a href (item-link) class "rssBoxItemTitle"]
         ]
         append content item-title
         if not empty? item-link [append content {</a>}]
         append content "</b>"
         if not empty? description [append content "<br>^/"]
      ]
      if (empty? compact) or (empty? item-title) [
         append content description
      ]
   ]
   append content "</p>^/"

   if item-counter = item-delimiter [break]
]

template: read %rss-box-template.html
if (setup = "true") and (javascript = "false") [
   setup-template: read %rss-setup-template.html
   src: copy rss-box-url
   forskip defaults 2 [
      var: first defaults
      if all [var <> 'javascript var <> 'setup][
         src: rejoin [src var "=" do to-string var "&"]
      ]
   ]
   src: rejoin [src "javascript=true"]
   replace/all src "#" "%23"
   replace setup-template "{javascript}" rejoin [
      {<script language="javascript" src="}
      src
      {"></script>}
   ]
   append template setup-template
   get-table-row: func [title content /local tr][
      if empty? content [return ""]
      tr: copy {^-^-<tr>^/^-^-^-<td align="right" valign="top">{title}:</td>^/^-^-^-<td valign="bottom">{content}</td>^/^-^-^-^</tr>^/}
      replace tr "{title}" title
      replace tr "{content}" content
      return tr
   ]
   info: make string! 500
   append info get-table-row "Title" title
   append info get-table-row "Description" about
   append info get-table-row "Published" pubdate
   append info get-table-row "Last Build" lastBuildDate
   append info get-table-row "Source" rejoin [{<a href="} url {">} short-url "</a>"]
   append info get-table-row "Format" reform [format version]
   docs: get-xml-content channel "docs"
   if not empty? docs [
      append info get-table-row "Docs" rejoin [{<a href="} docs {">} docs "</a>"]
   ]
   append info get-table-row "Copyright" copyright
   append info get-table-row "Managing Editor" managingEditor
   append info get-table-row "Webmaster" webMaster
   append info get-table-row "PICS-Rating" rating
   replace template "{info}" info
]

xml-button: copy ""
if xmlButton = "on" [
   xmlButton: " checked"
   xml-button: rejoin [{<a href="} url {" title="Click here to see the XML version of this channel."><img src="http://publish.curry.com/rss/xml.gif" width="36" height="14" border="0" title="Click here to see the XML version of this channel." align="right" valign="top"></a>}]
]

if compact = "on" [compact: " checked"]

; temporarily added dehex to be sure that values are url-decoded:
replace/all template "{url}" dehex url
replace/all template "{boxTitle}" dehex title
replace/all template "{align}" dehex align
replace/all template "{width}" dehex width
replace/all template "{frameColor}" dehex frameColor
replace/all template "{titleBarTextColor}" dehex titleBarTextColor
replace/all template "{titleBarColor}" dehex titleBarColor
replace/all template "{boxFillColor}" dehex boxFillColor
replace/all template "{textColor}" dehex textColor
replace/all template "{fontFace}" dehex fontFace
replace/all template "{maxItems}" maxItems
replace/all template "{xmlButton}" xmlButton
replace template "{xml-button}" xml-button
replace template "{compact}" compact
replace template "{text-input}" input-form

replace template "{link}" link
replace template "{date}" date
replace template "{description}" about
replace template "{content}" content

replace template "{image}" either compact = " checked" [""][image-html]

either javascript = "true" [
   do %js-lib.r
   document.write encode-javascript template
][
   print template
   ;print input-form
]

referrer: select cgi/other-headers "HTTP_REFERER"
ip: cgi/remote-addr
logfile: rejoin [%log/ now/date ".log"]
write/append logfile rejoin [now/time "^-" ip "^-" referrer "^/"]

-----------------------]

