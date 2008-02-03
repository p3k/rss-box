#!/usr/local/bin/rebol -cs

;; original usertalk call:
;; viewRssBox(url, boxTitle, align, width, frameColor, titleBarTextColor, \
;; titleBarColor, boxFillColor, timeZone, hspace, vspace, maxItems)

REBOL [
   Title:   "JavaScript RSS-Box Viewer"
   Date:    19-Mar-2001
   Name:    copy Title  ; For window title bar

   Version: 1.0.6
   File:    %index.r
   Home:    http://p3k.org/rss

   Author:  "Tobi Schaefer"
   Owner:   "p3k organisation"
   Rights:  "Copyright (C) p3k organisation 2006"

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
      1.0.1 [26-Apr-2004 {Fixed some minor bugs, mainly in the rendering framework. Added list of sites using this script.} "ts"]
      1.0.2 [16-Dec-2004 {Bugfix: catch error when displaying sitelist and logfile is corrupted.} "ts"]
      1.0.3 [20-Feb-2006 {Added "RSS box by p3k.org" boilerplate linking to the viewer URL.} "ts"]
      1.0.4 [13-Apr-2006 {Fixed feeds with the <guid> element to use these in their item links.} "ts"]
      1.0.5 [13-Jun-2006 {Bugfix: transform single quotes into &apos; (not &quot;) entities.} "ts"]
      1.0.6 [14-Aug-2006 {Replaced old-fashioned XML button with fresh and good-looking RSS icon.} "ts"]
   ]

   Language: 'English
]

;; uncomment the following line for debugging
;print "Content-type: text/plain^/"

rss-box-viewer: make object! [
   baseuri: "http://p3k.org/rss/"

   defaults: make object! [
      url: "http://blog.p3k.org/rss"
      align: "left"
      width: "200"
      frameColor: "black"
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
      nocache: "false"
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

   encode-url: func [
      {URL-encode a string}
      data "String to encode"
      /local new-data
   ][
      new-data: make string! ""
      normal-char: charset [
         #"A" - #"Z" #"a" - #"z"
         #"@" #"." #"*" #"-" #"_"
         #"0" - #"9"
      ]
      try [
         data: to-string data
      ][
         return new-data
      ]
      forall data [
         append new-data either find normal-char first data [
            first data
         ][
            rejoin ["%" to-string skip tail (to-hex to-integer first data) -2]
         ]
      ]
      return new-data
   ]

   logfile: rejoin [
      %log/ format-date now "y-M-d" ".log"
   ]

   log: func [/local cgi referrer] [
      if not exists? %log/ [make-dir %log/]
      cgi: system/options/cgi
      referrer: select cgi/other-headers "HTTP_REFERER"
      if find referrer "boredom.com" [quit]
      write/append rss-box-viewer/logfile rejoin [
         now/time "^-" cgi/remote-addr "^-{" referrer "}^/"
      ]
      return referrer
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
      if settings/nocache <> "true" and exists? cache [
         modify-time: modified? cache
         if (difference now modify-time) < 1:00 [
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
         return make string! 0 
      ]
      print "<!-- fetch from url -->"
      write/binary cache compress src
      return src
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
               lastBuildDate: modified? cache
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
            link: description: name: title: none
            use [element][
               element: xml/get-element rss "textinput"
               if not empty? element [
                  link: xml/get-content element "link"
                  description: xml/get-content element "description"
                  name: xml/get-content element "name"
                  title: xml/get-content element "title"
               ]
            ]
         ]
         image: make object! [
            title: source: link: width: height: description: none
            either format = "Scripting News" [
               source: xml/get-content channel "imageUrl"
               if not empty? source [
                  title: xml/get-content channel "imageTitle"
                  link: xml/get-content channel "imageLink"
                  width: xml/get-content channel "imageWidth"
                  height: xml/get-content channel "imageHeight"
                  description: xml/get-content channel "imageCaption"
               ]
            ][
               use [element][
                  source: ""
                  element: xml/get-element rss "image"
                  if empty? element [element: xml/get-element channel "image"]
                  if not empty? element [
                     source: xml/get-content element "url"
                     title: xml/get-content element "title"
                     link: xml/get-content element "link"
                     width: xml/get-content element "width"
                     height: xml/get-content element "height"
                     description: xml/get-content element "description"
                  ]
               ]
            ]
         ]
         items: make block! 100
         use [element][
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
                     replace/all description to-char 10 " "
                     use [link linetext url] [
                        link: xml/get-element child "link"
                        foreach [label attr item] link [
                           linktext: xml/get-content item "linktext"
                           replace/all linktext to-char 10 " "
                           linktext: trim linktext
                           url: xml/get-content item "url"
                           replace/case description linktext rejoin [
                              {<a href="} url {">} linktext "</a>"
                           ]
                        ]
                     ]
                  ][
                     description: xml/get-content child "description"
                     title: xml/get-content child "title"
                     link: xml/get-content child "link"
                     if empty? link [
                        link: xml/get-content child "guid"
                     ]
                  ]
               ]
               append items item
            ]
         ]
      ]
      return data
   ]

   render-template: func [
      template-file [file!]
      param [object!]
      /local newstr result macrolist
   ][
      result: read template-file
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
         if not empty? newstr [
            prefix: suffix: make string! 255
            parse macro [thru "prefix='" copy prefix to "'"]
            if not empty? prefix [insert newstr prefix]
            parse macro [thru "suffix='" copy suffix to "'"]
            if not empty? suffix [append newstr suffix]
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
            xmlButton: render-template %image.skin make object! [
               link: settings/url
               source: join baseuri "rss.png" border: "0"
               width: "16" height: "16" align: "right" valign: "top" 
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
            if all [
               not empty? settings/compact 
               not none? item/title 
               not empty? item/title
            ][
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
               break: either all [
                  not none? item/title
                  not empty? item/title
                  not empty? item/description
               ]["<br />"][""]
            ]
         ]
         if empty? settings/compact [
            if not none? data/text-input/link [
               textInput: render-template %textInput.skin data/text-input
            ]
            if not empty? data/image/source [
               image: render-template %image.skin make data/image [
                  align: "right" hspace: "5" vspace: "10"
               ]
            ]
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
         if settings/showXmlButton = "1" [
            showXmlButton: {checked="checked"}
         ]
         if settings/compact = "1" [
            compact: {checked="checked"}
         ]
         javascript: render-template %javascript.skin make settings [
            baseuri: rss-box-viewer/baseuri
            foreach p [
               'width 'align 'frameColor 'titleBarColor 'titleBarTextColor
               'boxFillColor 'textColor 'fontFace 'maxItems 'url
            ][
              set p encode-url get in settings p
            ]
         ]
         if error? sitelist: try [render-site-list][
            sitelist: ["(currently out of order)"]
         ]
      ]
   ]

   render-site-list: func [] [
      log: load rss-box-viewer/logfile
      reverse log
      first-entries: copy/part log 900
      list: make block! 0
      foreach [url ip time] first-entries [
         if url <> "none" [
            parts: parse/all url "/"
            hostname: parts/3
            if none? find list hostname [
               append list url
               append list hostname
            ]
         ]
      ]
      str: make string! 1000
      foreach [url hostname] copy/part list 100 [
         append str build-tag [a href (url)]
         append str hostname
         append str </a>
         append str <br />
      ]
      return str
   ]

   js-print: func [str [string!]][
      lines: parse/all str "^/"
      pairs: ["^-" "" "^/" "" "^'" "&apos;"]
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
      source: render-template %error.skin make settings [
         timestamp: to-utc-date now
         date: format-date timestamp "y-M-d"
         append date rejoin ["T" format-date timestamp "H-m" "Z"]
         url: rejoin [baseuri "?setup=true&compact=&url=" encode-url settings/url]
      ]
   ]
   document: xml/get-document source
   data: get-data (xml/get-element document)
]



;; the main section
rss-box: rss-box-viewer/render
either rss-box-viewer/settings/setup = "true" [
   print rss-box-viewer/render-setup rss-box
][
   rss-box-viewer/log
   print rss-box
]
