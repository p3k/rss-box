#!c:\programme\rebol\rebol.exe -cs

REBOL []

document.write: func [str][
	print rejoin [{document.write("} str {");^/}]
	]

encode-javascript: func [str][
	replace/all str "^-" ""
	replace/all str "^/" ""
	replace/all str "^"" "\^""
	return str
	]
