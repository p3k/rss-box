REBOL []

xml-parser!: make object! [
	decode: func [str][
		replace/all str "&lt;" "<"
		replace/all str "&gt;" ">"
		replace/all str "&apos;" "'"
		replace/all str "&quot;" "^""
		replace/all str "&amp;" "&"
		for i 128 255 1 [
			replace/case/all str rejoin ["&#" i ";"] to-char i
		]
		return str
	]
	
	encode: func [str][
		for i 128 255 1 [
			replace/case/all str to-char i rejoin ["&#" i ";"]
		]
		replace/all str "&" "&amp;"
		replace/all str "<" "&lt;"
		replace/all str ">" "&gt;"
		replace/all str "'" "&apos;"
		replace/all str "^"" "&quot;"
		return str
	]
	
	get-document: func [xml-text /local begin end clean-xml][
		parse xml-text [
			any [to "<?" begin: thru "?>" end: (remove/part begin (index? end) - 1)]
		]
		replace/all xml-text {<![CDATA[} ""
		replace/all xml-text {]]>} ""
		clean-xml: (clean parse-xml xml-text)
		return clean-xml
	]
	
	clean: func [parsed-xml level [any-type!] /local clean-xml][
		if not value? 'level [level: 1]
		clean-xml: make block! 10
		foreach element parsed-xml [
			either block? element [
				level: level + 1
				append/only clean-xml clean element
				level: level - 1
			][
				element: to-string element
				clutter-test: copy element
				replace/all clutter-test "^/" ""
				replace/all clutter-test "^-" ""
				replace/all clutter-test " " ""
				if not empty? clutter-test [
					append clean-xml element
				]
			]
		]
		return clean-xml
	]
		
	get-element: func [parsed-xml whichlabel [any-type!] /local content][
		if not value? 'whichlabel [return parsed-xml/3/1]
		content: make block! 100
		if block? parsed-xml/1 [parsed-xml: reduce [whichlabel none parsed-xml]]
		foreach [label1 attr1 data1] parsed-xml [
			foreach element data1 [
				foreach [label2 attr2 data2] element [
					if whichlabel = label2 [
						append content reduce [label2 attr2 data2]
					]
				]
			]
		]
		return content
	]
	
	get-label: func [parsed-xml][
		return parsed-xml/1
	]
	
	get-attribute: func [parsed-xml name /local attr][
		attr: select parsed-xml/2 name
		;if none? attr [return ""]
		return attr
	]
	
	get-content: func [parsed-xml label [any-type!] /local element][
		if not value? 'label [return to-string parsed-xml/3]
		element: get-element parsed-xml label
		if empty? element [return ""]
		if element/3 = "none" [return ""]
		return decode to-string element/3
	]
]
