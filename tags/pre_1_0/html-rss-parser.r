#!/home/tobi/rebol -cs

REBOL []

print "Content-Type: text/html^/"

do %/xml-lib.r

channel-url: "http://www.popo.at/"

if (last channel-url) <> #"/" [append channel-url "/"]
page: read to-url channel-url

channel-template: read %templates/rdf10/channel.xml
resource-template: read %templates/rdf10/resource.xml
item-template: read %templates/rdf10/item.xml

channel-title: ""
parse page [thru "<title>" copy channel-title to "</title>"]

description: ""
parse page [thru {<meta name="description" content="} copy description to {">}]

items: []
parse page [any [thru {<span class="rss:item">} copy item to {</span>} (append items item)]]

temp: []
parse page [any [thru {<span class="rss:url">} copy str to {</span>} (append temp str)]]

urls: []
foreach str temp [
	parse str [thru {<a href="} copy url to {"} (
		if url/1 = #"/" [remove url]
		if not find "http://" url [insert url channel-url]
		append urls url
		)]
	]

replace/all channel-template "{url}" channel-url
replace/all channel-template "{title}" encode-xml channel-title
replace/all channel-template "{about}" encode-xml description
replace/all channel-template "{imageUrl}" "http://www.popo.at/images/popotypo.gif"
replace channel-template "{updatePeriod}" "hour"

output-string: ""
foreach url urls [
	template: copy resource-template
	replace template "{url}" url
	append output-string template
	]

replace channel-template "{resources}" output-string

cnt: 1
output-string: ""
foreach item items [
	template: copy item-template
	;parse item [thru {<b>} copy title to {</b>}]
	title: ""
	url: pick urls cnt
	replace/all template "{url}" url
	replace template "{title}" title
	replace template "{description}" encode-xml item
	append output-string template
	cnt: cnt + 1
	]

replace channel-template "{items}" output-string

write ftp://tobi:p3kschloegln@www.popo.at/www/rss.xml channel-template

print {<a href="http://www.popo.at/rss.xml">rss.xml</a>}
