!function(){"use strict";var t,e,n,r,o,i,c={exports:{}};
/*!
    * domready (c) Dustin Diaz 2014 - License MIT
    */c.exports=(e=[],n=document,r=n.documentElement.doScroll,o="DOMContentLoaded",(i=(r?/^loaded|^c/:/^loaded|^i|^c/).test(n.readyState))||n.addEventListener(o,t=function(){for(n.removeEventListener(o,t),i=1;t=e.shift();)t()}),function(t){i?setTimeout(t,0):e.push(t)});var l=c.exports;function a(){}function u(t){return t()}function s(){return Object.create(null)}function f(t){t.forEach(u)}function d(t){return"function"==typeof t}function p(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function h(t){for(var e=[],n=arguments.length-1;n-- >0;)e[n]=arguments[n+1];if(null==t)return a;var r=t.subscribe.apply(t,e);return r.unsubscribe?function(){return r.unsubscribe()}:r}function m(t,e){t.appendChild(e)}function g(t,e,n){var r,o,i=((o=function(t){return t?t.getRootNode?t.getRootNode():t.ownerDocument:document}(t)).host,o);if(!(null===(r=i)||void 0===r?void 0:r.getElementById(e))){var c=y("style");c.id=e,c.textContent=n,function(t,e){m(t.head||t,e)}(i,c)}}function v(t,e,n){t.insertBefore(e,n||null)}function b(t){t.parentNode.removeChild(t)}function x(t,e){for(var n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function y(t){return document.createElement(t)}function w(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function k(t){return document.createTextNode(t)}function $(){return k(" ")}function j(){return k("")}function C(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function B(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function E(t,e,n,r){t.style.setProperty(e,n,r?"important":"")}var S,N=function(){this.e=this.n=null};function T(t){S=t}function R(){if(!S)throw new Error("Function called outside component initialization");return S}N.prototype.c=function(t){this.h(t)},N.prototype.m=function(t,e,n){void 0===n&&(n=null),this.e||(this.e=y(e.nodeName),this.t=e,this.c(t)),this.i(n)},N.prototype.h=function(t){this.e.innerHTML=t,this.n=Array.from(this.e.childNodes)},N.prototype.i=function(t){for(var e=0;e<this.n.length;e+=1)v(this.t,this.n[e],t)},N.prototype.p=function(t){this.d(),this.h(t),this.i(this.a)},N.prototype.d=function(){this.n.forEach(b)};var _=[],A=[],M=[],O=[],D=Promise.resolve(),F=!1;function L(t){M.push(t)}var q=!1,I=new Set;function P(){if(!q){q=!0;do{for(var t=0;t<_.length;t+=1){var e=_[t];T(e),U(e.$$)}for(T(null),_.length=0;A.length;)A.pop()();for(var n=0;n<M.length;n+=1){var r=M[n];I.has(r)||(I.add(r),r())}M.length=0}while(_.length);for(;O.length;)O.pop()();F=!1,q=!1,I.clear()}}function U(t){if(null!==t.fragment){t.update(),f(t.before_update);var e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(L)}}var z,H=new Set;function X(){z={r:0,c:[],p:z}}function Q(){z.r||f(z.c),z=z.p}function V(t,e){t&&t.i&&(H.delete(t),t.i(e))}function W(t,e,n,r){if(t&&t.o){if(H.has(t))return;H.add(t),z.c.push((function(){H.delete(t),r&&(n&&t.d(1),r())})),t.o(e)}}function Y(t,e){var n,r=e.token={};function o(t,n,o,i){if(e.token===r){e.resolved=i;var c=e.ctx;void 0!==o&&((c=c.slice())[o]=i);var l=t&&(e.current=t)(c),a=!1;e.block&&(e.blocks?e.blocks.forEach((function(t,r){r!==n&&t&&(X(),W(t,1,1,(function(){e.blocks[r]===t&&(e.blocks[r]=null)})),Q())})):e.block.d(1),l.c(),V(l,1),l.m(e.mount(),e.anchor),a=!0),e.block=l,e.blocks&&(e.blocks[n]=l),a&&P()}}if((n=t)&&"object"==typeof n&&"function"==typeof n.then){var i=R();if(t.then((function(t){T(i),o(e.then,1,e.value,t),T(null)}),(function(t){if(T(i),o(e.catch,2,e.error,t),T(null),!e.hasCatch)throw t})),e.current!==e.pending)return o(e.pending,0),!0}else{if(e.current!==e.then)return o(e.then,1,e.value,t),!0;e.resolved=t}}function G(t){t&&t.c()}function J(t,e,n,r){var o=t.$$,i=o.fragment,c=o.on_mount,l=o.on_destroy,a=o.after_update;i&&i.m(e,n),r||L((function(){var e=c.map(u).filter(d);l?l.push.apply(l,e):f(e),t.$$.on_mount=[]})),a.forEach(L)}function K(t,e){var n=t.$$;null!==n.fragment&&(f(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function Z(t,e){-1===t.$$.dirty[0]&&(_.push(t),F||(F=!0,D.then(P)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function tt(t,e,n,r,o,i,c,l){void 0===l&&(l=[-1]);var u=S;T(t);var d=t.$$={fragment:null,ctx:null,props:i,update:a,not_equal:o,bound:s(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(u?u.$$.context:e.context||[]),callbacks:s(),dirty:l,skip_bound:!1,root:e.target||u.$$.root};c&&c(d.root);var p=!1;if(d.ctx=n?n(t,e.props||{},(function(e,n){for(var r=[],i=arguments.length-2;i-- >0;)r[i]=arguments[i+2];var c=r.length?r[0]:n;return d.ctx&&o(d.ctx[e],d.ctx[e]=c)&&(!d.skip_bound&&d.bound[e]&&d.bound[e](c),p&&Z(t,e)),n})):[],d.update(),p=!0,f(d.before_update),d.fragment=!!r&&r(d.ctx),e.target){if(e.hydrate){var h=function(t){return Array.from(t.childNodes)}(e.target);d.fragment&&d.fragment.l(h),h.forEach(b)}else d.fragment&&d.fragment.c();e.intro&&V(t.$$.fragment),J(t,e.target,e.anchor,e.customElement),P()}T(u)}var et=function(){};et.prototype.$destroy=function(){K(this,1),this.$destroy=a},et.prototype.$on=function(t,e){var n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),function(){var t=n.indexOf(e);-1!==t&&n.splice(t,1)}},et.prototype.$set=function(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)};var nt=[];function rt(t,e){var n;void 0===e&&(e=a);var r=[];function o(e){if(p(t,e)&&(t=e,n)){for(var o=!nt.length,i=0;i<r.length;i+=1){var c=r[i];c[1](),nt.push(c,t)}if(o){for(var l=0;l<nt.length;l+=2)nt[l][0](nt[l+1]);nt.length=0}}}return{set:o,update:function(e){o(e(t))},subscribe:function(i,c){void 0===c&&(c=a);var l=[i,c];return r.push(l),1===r.length&&(n=e(o)||a),i(t),function(){var t=r.indexOf(l);-1!==t&&r.splice(t,1),0===r.length&&(n(),n=null)}}}}var ot={app:"https://p3k.org/rss",proxy:"https://p3k.org/json/roxy",referrers:"https://p3k.org/json/ferris?group=rss-box",feed:"https://blog.p3k.org/stories.xml"},it="http://localhost",ct={app:it+":8000",proxy:it+":8000/roxy",referrers:it+":8000/ferris?group=rss-box",feed:"https://blog.p3k.org/stories.xml"};Object.keys(ot).forEach((function(t){t in ct&&(ct[t]=ot[t])}));var lt={loading:!1,compact:!1,maxItems:3,format:"Error",version:"⚡",title:"RSS Box Error",description:"This output was automatically generated to report an error that occurred during a request to the RSS Box Viewer.",image:"",items:[{title:"Oops, something went wrong…",description:"An error occurred while processing the request to the RSS Box Viewer."},{title:"The following error message was returned:",description:"Unknown error"},{title:""}]};function at(){var t="http://purl.org/dc/elements/1.1/",e=/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9:]+).*$/,n=function(t,e,n){if(!t||!e)return null;var r="getElementsByTagName";return n&&(r+="NS"),e[r](t,n)[0]},r=function(t){return t?(t.length&&(t=t[0]),t.textContent):""},o=Error("Malformed RSS syntax"),i=function(t,e){var r=n("source",t),o=Array.apply(null,t.getElementsByTagName("enclosure")),i=n("category",t);return r&&(e.source={url:r.getAttribute("url"),title:r.textContent}),e.enclosures=o.map((function(t){return{url:t.getAttribute("url"),length:t.getAttribute("length"),type:t.getAttribute("type")}})),i&&(e.category={domain:i.getAttribute("domain")||"",content:i.textContent}),e},c=function(t){var n=Date.parse(t);return isNaN(n)&&(n=Date.parse(String(t).replace(e,"$1/$2/$3 $4")),isNaN(n)&&(n=Date.now())),new Date(n)};return{parse:function(e){var l=function(t){if(t){var e;return document.implementation.createDocument?e=(new DOMParser).parseFromString(t,"application/xml"):window.ActiveXObject&&((e=new window.ActiveXObject("Microsoft.XMLDOM")).async="false",e.loadXML(t)),e}}(e);if(!l||n("parsererror",l.documentElement))throw o;var a=l.documentElement,u=a.nodeName;switch(u){case"feed":return function(t){var e={items:[],format:"Atom",version:"1.0"};e.title=r(n("title",t)),e.description=r(n("subtitle",t)),e.image="";var o=n("link:not([self])",t);return o&&(e.link=o.getAttribute("href")),e.date=c(n("updated",t)),Array.apply(null,t.getElementsByTagName("entry")).forEach((function(t){var o={title:r(n("title",t)),description:r(n("summary",t))},i=n("link",t);i&&(o.link=i.getAttribute("href")),e.items.push(o)})),e}(a);case"scriptingNews":return function(t){var e={items:[]},l=n("header",t);if(!l)throw o;e.format="Scripting News",e.version=r(n("scriptingNewsVersion",l)),e.title=r(n("channelTitle",l)),e.description=r(n("channelDescription",l)),e.link=r(n("channelLink",l)),e.date=c(r(n("lastBuildDate",l))||r(n("pubDate",l)));var a=n("imageUrl",l);return a&&(e.image={source:r(a),title:r(n("imageTitle",l)),link:r(n("imageLink",l)),width:r(n("imageWidth",l)),height:r(n("imageHeight",l)),description:r(n("imageCaption",l))}),Array.apply(null,t.getElementsByTagName("item")).forEach((function(t){var o={title:""};o.description=r(n("text",t)).replace(/\n/g," ");var c=n("link",t);if(c){var l=r(n("linetext",c)).replace(/\n/g," ").trim();l&&(o.description=o.description.replace(new RegExp(l),'<a href="'+r(n("url",t))+'">'+l+"</a>")),o.link=r(n("url",c))}i(t,o),e.items.push(o)})),e}(a);default:return function(e,l){var a={items:[]},u=n("channel",e);if(!u)throw o;a.format="RSS",a.version="rdf:RDF"===l?"1.0":e.getAttribute("version"),a.title=r(n("title",u)),a.description=r(n("description",u)),a.link=r(n("link",u));var s=n("image",u);if(a.image=s?{source:r(n("url",s))||s.getAttributeNS("http://www.w3.org/1999/02/22-rdf-syntax-ns#","resource"),title:r(n("title",s)),link:r(n("link",s)),width:r(n("width",s)),height:r(n("height",s)),description:r(n("description",s))}:"","rdf:RDF"===l){var f=u.getElementsByTagNameNS(t,"date");a.date=c(r(f)),a.rights=r(u.getElementsByTagNameNS(t,"creator"));var d=n("textinput",e);a.input=d?{link:r(n("link",d)),description:r(n("description",d)),name:r(n("name",d)),title:r(n("title",d))}:""}else a.date=c(r(n("lastBuildDate",u))||r(n("pubDate",u))),a.rights=r(n("copyright",u));return Array.apply(null,e.getElementsByTagName("item")).forEach((function(t){var e={title:r(n("title",t)),description:r(n("description",t)),link:r(n("link",t))||r(n("guid",t))};if(!e.description){var o=r(n("encoded",t,"content"));(o||(o=r(n("encoded",t))))&&(e.description=o)}i(t,e),a.items.push(e)})),a}(a,u)}}}}var ut={100:"Continue",101:"Switching Protocols",102:"Processing",103:"Early Hints",200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",207:"Multi-Status",208:"Already Reported",226:"IM Used",300:"Multiple Choices",301:"Moved Permanently",302:"Found",303:"See Other",304:"Not Modified",305:"Use Proxy",307:"Temporary Redirect",308:"Permanent Redirect",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Payload Too Large",414:"URI Too Long",415:"Unsupported Media Type",416:"Range Not Satisfiable",417:"Expectation Failed",418:"I'm a Teapot",421:"Misdirected Request",422:"Unprocessable Entity",423:"Locked",424:"Failed Dependency",425:"Too Early",426:"Upgrade Required",428:"Precondition Required",429:"Too Many Requests",431:"Request Header Fields Too Large",451:"Unavailable For Legal Reasons",500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported",506:"Variant Also Negotiates",507:"Insufficient Storage",508:"Loop Detected",509:"Bandwidth Limit Exceeded",510:"Not Extended",511:"Network Authentication Required"},st=function(t){var e=rt(t),n=e.subscribe,r=e.update,o=function(t){return r((function(e){return Object.keys(t).forEach((function(n){n in e!=!1&&(e[n]=t[n],e=e)})),e}))};return{subscribe:n,update:o,set:o}};function ft(t){if(t){var e=this;e.set({loading:!0});var n=new Headers({Accept:["application/rss+xml","application/rdf+xml","application/atom+xml","application/xml;q=0.9","text/xml;q=0.8"].join()});fetch(ct.proxy+"?url="+encodeURIComponent(t),{headers:n,referrerPolicy:"no-referrer"}).then((function(t){if(t.status>399)throw Error(ut[t.status]);return t.json()})).then((function(t){var n=at().parse(t.content);n.date||(n.date=new Date(t.headers.date)),e.set(Object.assign({},n,{loading:!1}))})).catch((function(n){e.set(function(t,e){var n=Object.assign({},lt);return n.link=ct.app+"?url="+t,n.items[1].description=e,n.items[2].description='\n    Most likely, this might have happened because of a non-existent or invalid RSS feed URL.\n    <a href="https://validator.w3.org/feed/check.cgi?url='+t+'">Please check</a> and\n    possibly correct your input, then try again.\n  ',n}(t,n)),console.error(n)}))}}var dt,pt=function(t){if(t){var e=(t.getMonth()+1).toString().padStart(2,"0"),n=t.getDate().toString().padStart(2,"0"),r=t.getHours().toString().padStart(2,"0"),o=t.getMinutes().toString().padStart(2,"0");return t.getFullYear()+"-"+e+"-"+n+", "+r+":"+o+"h"}},ht=function(){return st({align:"initial",boxFillColor:"#ffead2",compact:!1,fontFace:"10pt sans-serif",frameColor:"#b3a28e",headless:!1,height:"",linkColor:"#2c7395",maxItems:7,radius:5,showXmlButton:!0,textColor:"#95412b",titleBarColor:"#90a8b3",titleBarTextColor:"#ffead2",url:"",width:""})},mt=function(){var t=st({date:new Date,description:"",format:"",image:"",input:"",items:[],link:"",loading:!1,title:"",version:""});return t.fetch=ft.bind(t),t.formatDate=pt.bind(t),t};rt({description:"RSS Box Viewer",version:"21.12.11"},dt).subscribe,ht(),mt();var gt=rt([]);function vt(t){g(t,"svelte-mfbc6b","svg.svelte-mfbc6b{width:1.2em;height:1.2em}polygon.svelte-mfbc6b{fill:currentColor;fill-rule:evenodd;clip-rule:evenodd}")}function bt(t){var e,n,r,o;return{c:function(){e=w("svg"),n=w("g"),r=w("polygon"),o=w("polygon"),C(r,"points","2,2 5,2 5,3 3,3 3,9 9,9 9,7 10,7 10,10 2,10"),C(r,"class","svelte-mfbc6b"),C(o,"points","6.211,2 10,2 10,5.789 8.579,4.368 6.447,6.5 5.5,5.553 7.632,3.421"),C(o,"class","svelte-mfbc6b"),C(e,"xmlns","http://www.w3.org/2000/svg"),C(e,"viewBox","0 0 12 12"),C(e,"preserveAspectRatio","xMinYMin"),C(e,"class","svelte-mfbc6b")},m:function(t,i){v(t,e,i),m(e,n),m(n,r),m(n,o)},p:a,i:a,o:a,d:function(t){t&&b(e)}}}gt.fetch=function(){var t=this;fetch(ct.referrers).then((function(t){return t.json()})).then((function(e){var n=e.reduce((function(t,e){if(e.url.startsWith("http")&&!e.url.startsWith(ct.app)&&e.url.indexOf("atari-embeds.googleusercontent.com")<0){var n=e.url.replace(/^([^.]*)www\./,"$1"),r=n.split("/")[2],o=t[r];o?e.hits>o.hits&&(o.url=e.url,o.hits=e.hits):(o={host:r,url:n,hits:e.hits,total:0},t[r]=o,t.push(o)),o.total+=e.hits,o.metadata=e.metadata||{feedUrls:[]}}return t}),[]),r=n.reduce((function(t,e){return t+e.total}),0),o=n.map((function(t){return t.percentage=t.total/r*100,t}));o.sort((function(t,e){return e.percentage-t.percentage})),t.set(o)}))}.bind(gt);var xt=function(t){function e(e){t.call(this),tt(this,e,null,bt,p,{},vt)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(et);function yt(t){g(t,"svelte-ibnekz","svg.svelte-ibnekz{width:1em;height:1em}path.svelte-ibnekz{fill:currentColor}")}function wt(t){var e,n,r;return{c:function(){e=w("svg"),n=w("g"),C(r=w("path"),"d","M 384,192 Q 384,112 328,56 272,0 192,0 112,0 56,56 0,112 0,192 q 0,80 56,136 56,56 136,56 80,0 136,-56 56,-56 56,-136 z M 896,69 Q 898,41 879,21 861,0 832,0 H 697 Q 672,0 654,16.5 636,33 634,58 612,287 449.5,449.5 287,612 58,634 33,636 16.5,654 0,672 0,697 v 135 q 0,29 21,47 17,17 43,17 h 5 Q 229,883 375,815.5 521,748 634,634 748,521 815.5,375 883,229 896,69 z m 512,-2 Q 1410,40 1390,20 1372,0 1344,0 H 1201 Q 1175,0 1156.5,17.5 1138,35 1137,60 1125,275 1036,468.5 947,662 804.5,804.5 662,947 468.5,1036 275,1125 60,1138 35,1139 17.5,1157.5 0,1176 0,1201 v 143 q 0,28 20,46 18,18 44,18 h 3 Q 329,1395 568.5,1288 808,1181 994,994 1181,808 1288,568.5 1395,329 1408,67 z"),C(r,"class","svelte-ibnekz"),C(n,"transform","matrix(1,0,0,-1,212.61017,1346.1695)"),C(e,"xmlns","http://www.w3.org/2000/svg"),C(e,"viewBox","0 -256 1792 1792"),C(e,"preserveAspectRatio","xMinYMin"),C(e,"class","svelte-ibnekz")},m:function(t,o){v(t,e,o),m(e,n),m(n,r)},p:a,i:a,o:a,d:function(t){t&&b(e)}}}var kt=function(t){function e(e){t.call(this),tt(this,e,null,wt,p,{},yt)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(et);function $t(t){g(t,"svelte-1bdkb67","svg.svelte-1bdkb67{width:1.2em;height:1.2em}path.svelte-1bdkb67{fill:currentColor}")}function jt(t){var e,n;return{c:function(){e=w("svg"),C(n=w("path"),"d","m409 531l-5.244 6.733c-.983 1.262-.708 3.511.55 4.497 1.259.986 3.5.71 4.484-.552l5.244-6.733.655-.842c.656-.842.472-2.341-.367-2.998-.839-.658-2.334-.473-2.989.368l-.656.842-3.933 5.05-.656.842c-.328.421-.236 1.17.183 1.499.42.329 1.167.237 1.495-.184l4.589-5.891.839.658-4.589 5.891c-.656.842-2.15 1.026-2.989.368-.839-.658-1.023-2.157-.367-2.998l.656-.842 4.589-5.891c.983-1.262 3.225-1.538 4.484-.552 1.259.986 1.534 3.235.551 4.497l-.656.842-5.244 6.733c-1.311 1.683-4.3 2.051-5.978.736-1.678-1.315-2.045-4.313-.734-5.997l5.244-6.733.839.658"),C(n,"transform","matrix(.84782 0 0 .84521-338.85-445.68)"),C(n,"stroke","none"),C(n,"class","svelte-1bdkb67"),C(e,"xmlns","http://www.w3.org/2000/svg"),C(e,"viewBox","0 0 16 16"),C(e,"preserveAspectRatio","xMinYMin"),C(e,"class","svelte-1bdkb67")},m:function(t,r){v(t,e,r),m(e,n)},p:a,i:a,o:a,d:function(t){t&&b(e)}}}var Ct=function(t){function e(e){t.call(this),tt(this,e,null,jt,p,{},$t)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(et);function Bt(t){g(t,"svelte-1rjx8bp",".rssbox.svelte-1rjx8bp.svelte-1rjx8bp{box-sizing:border-box;width:100%;border:1px solid #000;font-family:sans-serif;overflow:hidden;border-radius:0;-moz-border-radius:0}.rssbox-icon.svelte-1rjx8bp.svelte-1rjx8bp{float:right;width:1em;margin-left:0.5em}.rssbox-titlebar.svelte-1rjx8bp.svelte-1rjx8bp{padding:0.5em;color:#000;background-color:#add8e6;border-bottom:1px solid #000;font-weight:bold;letter-spacing:0.01em}.rssbox-date.svelte-1rjx8bp.svelte-1rjx8bp{margin-top:0.2em;font-size:0.8em;font-weight:normal}.rssbox-content.svelte-1rjx8bp.svelte-1rjx8bp{height:auto;padding:0.5em;overflow-x:hidden;overflow-y:auto;background-color:#fff;clear:both;-ms-overflow-style:-ms-autohiding-scrollbar}.rssbox-content.svelte-1rjx8bp aside.svelte-1rjx8bp{clear:both;float:right}.rssbox-content.svelte-1rjx8bp aside a.svelte-1rjx8bp{display:block;margin-left:0.5em}.rssbox-image.svelte-1rjx8bp.svelte-1rjx8bp{float:right;margin:0 0 0.5em 0.5em;background-position:left center;background-repeat:no-repeat;background-size:contain}.rssbox-item-title.bold.svelte-1rjx8bp.svelte-1rjx8bp{font-weight:bold}.rssbox-enclosure.svelte-1rjx8bp.svelte-1rjx8bp,.rssbox-source.svelte-1rjx8bp.svelte-1rjx8bp{display:block;width:1em}.rssbox-form.svelte-1rjx8bp.svelte-1rjx8bp{margin-bottom:0.8em}.rssbox-form.svelte-1rjx8bp input.svelte-1rjx8bp{padding:0.5em;background-color:#fff}.rssbox-promo.svelte-1rjx8bp.svelte-1rjx8bp{text-align:right;font-size:0.7em;letter-spacing:0.01em}")}function Et(t,e,n){var r=t.slice();return r[7]=e[n],r[9]=n,r}function St(t,e,n){var r=t.slice();return r[10]=e[n],r}function Nt(t){var e,n,r,o,i,c,l,a,u,s,f=t[6].title+"",d=t[0].formatDate(t[6].date)+"",p=t[2].showXmlButton&&Tt(t);return{c:function(){e=y("div"),p&&p.c(),n=$(),r=y("div"),o=y("a"),i=k(f),l=$(),a=y("div"),u=k(d),C(o,"href",c=t[6].link),E(o,"color",t[2].titleBarTextColor),C(a,"class","rssbox-date svelte-1rjx8bp"),C(e,"class","rssbox-titlebar svelte-1rjx8bp"),E(e,"color",t[2].titleBarTextColor),E(e,"background-color",t[2].titleBarColor),E(e,"border-bottom-color",t[2].frameColor)},m:function(t,c){v(t,e,c),p&&p.m(e,null),m(e,n),m(e,r),m(r,o),m(o,i),m(e,l),m(e,a),m(a,u),s=!0},p:function(t,r){t[2].showXmlButton?p?(p.p(t,r),4&r&&V(p,1)):((p=Tt(t)).c(),V(p,1),p.m(e,n)):p&&(X(),W(p,1,1,(function(){p=null})),Q()),(!s||64&r)&&f!==(f=t[6].title+"")&&B(i,f),(!s||64&r&&c!==(c=t[6].link))&&C(o,"href",c),(!s||4&r)&&E(o,"color",t[2].titleBarTextColor),(!s||65&r)&&d!==(d=t[0].formatDate(t[6].date)+"")&&B(u,d),(!s||4&r)&&E(e,"color",t[2].titleBarTextColor),(!s||4&r)&&E(e,"background-color",t[2].titleBarColor),(!s||4&r)&&E(e,"border-bottom-color",t[2].frameColor)},i:function(t){s||(V(p),s=!0)},o:function(t){W(p),s=!1},d:function(t){t&&b(e),p&&p.d()}}}function Tt(t){var e,n,r,o,i,c;return r=new kt({}),{c:function(){e=y("div"),n=y("a"),G(r.$$.fragment),C(n,"href",o=t[2].url),C(n,"title",i=t[6].format+" "+t[6].version),E(n,"color",t[2].titleBarTextColor),C(e,"class","rssbox-icon svelte-1rjx8bp")},m:function(t,o){v(t,e,o),m(e,n),J(r,n,null),c=!0},p:function(t,e){(!c||4&e&&o!==(o=t[2].url))&&C(n,"href",o),(!c||64&e&&i!==(i=t[6].format+" "+t[6].version))&&C(n,"title",i),(!c||4&e)&&E(n,"color",t[2].titleBarTextColor)},i:function(t){c||(V(r.$$.fragment,t),c=!0)},o:function(t){W(r.$$.fragment,t),c=!1},d:function(t){t&&b(e),K(r)}}}function Rt(t){var e,n,r={ctx:t,current:null,token:null,hasCatch:!1,pending:Mt,then:At,catch:_t,value:13};return Y(n=Yt(t[6].image),r),{c:function(){e=j(),r.block.c()},m:function(t,n){v(t,e,n),r.block.m(t,r.anchor=n),r.mount=function(){return e.parentNode},r.anchor=e},p:function(e,o){t=e,r.ctx=t,64&o&&n!==(n=Yt(t[6].image))&&Y(n,r)||function(t,e,n){var r=e.slice(),o=t.resolved;t.current===t.then&&(r[t.value]=o),t.current===t.catch&&(r[t.error]=o),t.block.p(r,n)}(r,t,o)},d:function(t){t&&b(e),r.block.d(t),r.token=null,r=null}}}function _t(t){return{c:a,m:a,p:a,d:a}}function At(t){var e,n,r,o,i;return{c:function(){e=y("a"),C(n=y("div"),"alt",r=t[6].image.description),C(n,"class","rssbox-image svelte-1rjx8bp"),E(n,"background-image","url("+t[6].image.source+")"),E(n,"width",t[13].width),E(n,"height",t[13].height),C(e,"href",o=t[6].image.link),C(e,"title",i=t[6].image.title),C(e,"class","svelte-1rjx8bp")},m:function(t,r){v(t,e,r),m(e,n)},p:function(t,c){64&c&&r!==(r=t[6].image.description)&&C(n,"alt",r),64&c&&E(n,"background-image","url("+t[6].image.source+")"),64&c&&E(n,"width",t[13].width),64&c&&E(n,"height",t[13].height),64&c&&o!==(o=t[6].image.link)&&C(e,"href",o),64&c&&i!==(i=t[6].image.title)&&C(e,"title",i)},d:function(t){t&&b(e)}}}function Mt(t){return{c:a,m:a,p:a,d:a}}function Ot(t){var e,n,r,o=t[7].title&&Dt(t),i=!t[2].compact&&qt(t);return{c:function(){e=y("div"),o&&o.c(),n=$(),i&&i.c(),C(e,"class","rssbox-item-content rssBoxItemContent"),E(e,"color",t[2].textColor)},m:function(t,c){v(t,e,c),o&&o.m(e,null),m(e,n),i&&i.m(e,null),r=!0},p:function(t,c){t[7].title?o?o.p(t,c):((o=Dt(t)).c(),o.m(e,n)):o&&(o.d(1),o=null),t[2].compact?i&&(X(),W(i,1,1,(function(){i=null})),Q()):i?(i.p(t,c),4&c&&V(i,1)):((i=qt(t)).c(),V(i,1),i.m(e,null)),(!r||4&c)&&E(e,"color",t[2].textColor)},i:function(t){r||(V(i),r=!0)},o:function(t){W(i),r=!1},d:function(t){t&&b(e),o&&o.d(),i&&i.d()}}}function Dt(t){var e,n;function r(t,e){return t[7].link?Lt:Ft}var o=r(t),i=o(t);return{c:function(){e=y("div"),i.c(),C(e,"class",n="rssbox-item-title "+t[3]+" svelte-1rjx8bp")},m:function(t,n){v(t,e,n),i.m(e,null)},p:function(t,c){o===(o=r(t))&&i?i.p(t,c):(i.d(1),(i=o(t))&&(i.c(),i.m(e,null))),8&c&&n!==(n="rssbox-item-title "+t[3]+" svelte-1rjx8bp")&&C(e,"class",n)},d:function(t){t&&b(e),i.d()}}}function Ft(t){var e,n,r=t[7].title+"";return{c:function(){e=new N,n=j(),e.a=n},m:function(t,o){e.m(r,t,o),v(t,n,o)},p:function(t,n){64&n&&r!==(r=t[7].title+"")&&e.p(r)},d:function(t){t&&b(n),t&&e.d()}}}function Lt(t){var e,n,r=t[7].title+"";return{c:function(){C(e=y("a"),"href",n=t[7].link),C(e,"class","svelte-1rjx8bp")},m:function(t,n){v(t,e,n),e.innerHTML=r},p:function(t,o){64&o&&r!==(r=t[7].title+"")&&(e.innerHTML=r),64&o&&n!==(n=t[7].link)&&C(e,"href",n)},d:function(t){t&&b(e)}}}function qt(t){var e,n,r,o,i,c,l=t[7].description+"",a=t[7].source&&It(t),u=t[7].enclosures&&zt(t);return{c:function(){e=y("aside"),a&&a.c(),n=$(),u&&u.c(),r=$(),o=new N,i=j(),C(e,"class","svelte-1rjx8bp"),o.a=i},m:function(t,s){v(t,e,s),a&&a.m(e,null),m(e,n),u&&u.m(e,null),v(t,r,s),o.m(l,t,s),v(t,i,s),c=!0},p:function(t,r){t[7].source?a?(a.p(t,r),64&r&&V(a,1)):((a=It(t)).c(),V(a,1),a.m(e,n)):a&&(X(),W(a,1,1,(function(){a=null})),Q()),t[7].enclosures?u?(u.p(t,r),64&r&&V(u,1)):((u=zt(t)).c(),V(u,1),u.m(e,null)):u&&(X(),W(u,1,1,(function(){u=null})),Q()),(!c||64&r)&&l!==(l=t[7].description+"")&&o.p(l)},i:function(t){c||(V(a),V(u),c=!0)},o:function(t){W(a),W(u),c=!1},d:function(t){t&&b(e),a&&a.d(),u&&u.d(),t&&b(r),t&&b(i),t&&o.d()}}}function It(t){var e,n,r,o,i,c,l,a=[Ut,Pt],u=[];function s(t,e){return 64&e&&(n=!!t[7].source.url.endsWith(".xml")),n?0:1}return r=s(t,-1),o=u[r]=a[r](t),{c:function(){e=y("a"),o.c(),C(e,"href",i=t[7].source.url),C(e,"title",c=t[7].source.title),C(e,"class","rssbox-source svelte-1rjx8bp")},m:function(t,n){v(t,e,n),u[r].m(e,null),l=!0},p:function(t,n){var f=r;(r=s(t,n))!==f&&(X(),W(u[f],1,1,(function(){u[f]=null})),Q(),(o=u[r])||(o=u[r]=a[r](t)).c(),V(o,1),o.m(e,null)),(!l||64&n&&i!==(i=t[7].source.url))&&C(e,"href",i),(!l||64&n&&c!==(c=t[7].source.title))&&C(e,"title",c)},i:function(t){l||(V(o),l=!0)},o:function(t){W(o),l=!1},d:function(t){t&&b(e),u[r].d()}}}function Pt(t){var e,n;return e=new xt({}),{c:function(){G(e.$$.fragment)},m:function(t,r){J(e,t,r),n=!0},i:function(t){n||(V(e.$$.fragment,t),n=!0)},o:function(t){W(e.$$.fragment,t),n=!1},d:function(t){K(e,t)}}}function Ut(t){var e,n;return e=new kt({}),{c:function(){G(e.$$.fragment)},m:function(t,r){J(e,t,r),n=!0},i:function(t){n||(V(e.$$.fragment,t),n=!0)},o:function(t){W(e.$$.fragment,t),n=!1},d:function(t){K(e,t)}}}function zt(t){for(var e,n,r=t[7].enclosures,o=[],i=0;i<r.length;i+=1)o[i]=Ht(St(t,r,i));var c=function(t){return W(o[t],1,1,(function(){o[t]=null}))};return{c:function(){for(var t=0;t<o.length;t+=1)o[t].c();e=j()},m:function(t,r){for(var i=0;i<o.length;i+=1)o[i].m(t,r);v(t,e,r),n=!0},p:function(t,n){if(64&n){var i;for(r=t[7].enclosures,i=0;i<r.length;i+=1){var l=St(t,r,i);o[i]?(o[i].p(l,n),V(o[i],1)):(o[i]=Ht(l),o[i].c(),V(o[i],1),o[i].m(e.parentNode,e))}for(X(),i=r.length;i<o.length;i+=1)c(i);Q()}},i:function(t){if(!n){for(var e=0;e<r.length;e+=1)V(o[e]);n=!0}},o:function(t){o=o.filter(Boolean);for(var e=0;e<o.length;e+=1)W(o[e]);n=!1},d:function(t){x(o,t),t&&b(e)}}}function Ht(t){var e,n,r,o,i,c;return n=new Ct({}),{c:function(){e=y("a"),G(n.$$.fragment),r=$(),C(e,"href",o=t[10].url),C(e,"title",i=Wt(t[10].length)+" "+t[10].type),C(e,"class","rssbox-enclosure svelte-1rjx8bp")},m:function(t,o){v(t,e,o),J(n,e,null),m(e,r),c=!0},p:function(t,n){(!c||64&n&&o!==(o=t[10].url))&&C(e,"href",o),(!c||64&n&&i!==(i=Wt(t[10].length)+" "+t[10].type))&&C(e,"title",i)},i:function(t){c||(V(n.$$.fragment,t),c=!0)},o:function(t){W(n.$$.fragment,t),c=!1},d:function(t){t&&b(e),K(n)}}}function Xt(t){var e,n,r=t[9]<t[2].maxItems&&Ot(t);return{c:function(){r&&r.c(),e=j()},m:function(t,o){r&&r.m(t,o),v(t,e,o),n=!0},p:function(t,n){t[9]<t[2].maxItems?r?(r.p(t,n),4&n&&V(r,1)):((r=Ot(t)).c(),V(r,1),r.m(e.parentNode,e)):r&&(X(),W(r,1,1,(function(){r=null})),Q())},i:function(t){n||(V(r),n=!0)},o:function(t){W(r),n=!1},d:function(t){r&&r.d(t),t&&b(e)}}}function Qt(t){var e,n,r,o,i;return{c:function(){e=y("form"),C(n=y("input"),"type","text"),C(n,"name",r=t[6].input.name),C(n,"placeholder","Enter search & hit return…"),C(n,"data-placeholder",o=t[6].input.description),C(n,"class","svelte-1rjx8bp"),C(e,"class","rssbox-form svelte-1rjx8bp"),C(e,"method","get"),C(e,"action",i=t[6].input.link)},m:function(t,r){v(t,e,r),m(e,n)},p:function(t,c){64&c&&r!==(r=t[6].input.name)&&C(n,"name",r),64&c&&o!==(o=t[6].input.description)&&C(n,"data-placeholder",o),64&c&&i!==(i=t[6].input.link)&&C(e,"action",i)},d:function(t){t&&b(e)}}}function Vt(t){for(var e,n,r,o,i,c,l,a,u,s,f,d=!t[2].headless&&Nt(t),p=t[6].image&&!t[2].compact&&Rt(t),h=t[6].items,g=[],w=0;w<h.length;w+=1)g[w]=Xt(Et(t,h,w));var j=function(t){return W(g[t],1,1,(function(){g[t]=null}))},B=t[6].input&&Qt(t);return{c:function(){e=y("div"),d&&d.c(),n=$(),r=y("div"),p&&p.c(),o=$();for(var f=0;f<g.length;f+=1)g[f].c();i=$(),B&&B.c(),c=$(),l=y("div"),a=y("a"),u=k("RSS Box by p3k.org"),C(a,"href",ct.app),E(a,"color",t[2].textColor),C(a,"class","svelte-1rjx8bp"),C(l,"class","rssbox-promo rssBoxPromo svelte-1rjx8bp"),C(r,"class","rssbox-content rssBoxContent svelte-1rjx8bp"),E(r,"background-color",t[2].boxFillColor),E(r,"height",t[5]),C(e,"data-link-color",s=t[2].linkColor),C(e,"class","rssbox rssBox svelte-1rjx8bp"),E(e,"max-width",t[4]),E(e,"border-color",t[2].frameColor),E(e,"border-radius",t[2].radius+"px"),E(e,"font",t[2].fontFace),E(e,"float",t[2].align)},m:function(t,s){v(t,e,s),d&&d.m(e,null),m(e,n),m(e,r),p&&p.m(r,null),m(r,o);for(var h=0;h<g.length;h+=1)g[h].m(r,null);m(r,i),B&&B.m(r,null),m(r,c),m(r,l),m(l,a),m(a,u),f=!0},p:function(t,l){var u=l[0];if(t[2].headless?d&&(X(),W(d,1,1,(function(){d=null})),Q()):d?(d.p(t,u),4&u&&V(d,1)):((d=Nt(t)).c(),V(d,1),d.m(e,n)),t[6].image&&!t[2].compact?p?p.p(t,u):((p=Rt(t)).c(),p.m(r,o)):p&&(p.d(1),p=null),76&u){var m;for(h=t[6].items,m=0;m<h.length;m+=1){var v=Et(t,h,m);g[m]?(g[m].p(v,u),V(g[m],1)):(g[m]=Xt(v),g[m].c(),V(g[m],1),g[m].m(r,i))}for(X(),m=h.length;m<g.length;m+=1)j(m);Q()}t[6].input?B?B.p(t,u):((B=Qt(t)).c(),B.m(r,c)):B&&(B.d(1),B=null),(!f||4&u)&&E(a,"color",t[2].textColor),(!f||4&u)&&E(r,"background-color",t[2].boxFillColor),(!f||32&u)&&E(r,"height",t[5]),(!f||4&u&&s!==(s=t[2].linkColor))&&C(e,"data-link-color",s),(!f||16&u)&&E(e,"max-width",t[4]),(!f||4&u)&&E(e,"border-color",t[2].frameColor),(!f||4&u)&&E(e,"border-radius",t[2].radius+"px"),(!f||4&u)&&E(e,"font",t[2].fontFace),(!f||4&u)&&E(e,"float",t[2].align)},i:function(t){if(!f){V(d);for(var e=0;e<h.length;e+=1)V(g[e]);f=!0}},o:function(t){W(d),g=g.filter(Boolean);for(var e=0;e<g.length;e+=1)W(g[e]);f=!1},d:function(t){t&&b(e),d&&d.d(),p&&p.d(),x(g,t),B&&B.d()}}}function Wt(t){return(t/1e3).toFixed(2)+" kB"}function Yt(t){return new Promise((function(e){var n=new Image;n.onload=function(){var t=Math.min(100,n.width),r=n.width>t?t/n.width:1;e({width:n.width*r+"px",height:n.height*r+"px"})},n.src=t.source}))}function Gt(t,e,n){var r,o,i,c,l,u=a,s=function(){return u(),u=h(g,(function(t){return n(2,c=t)})),g},f=a,d=function(){return f(),f=h(p,(function(t){return n(6,l=t)})),p};t.$$.on_destroy.push((function(){return u()})),t.$$.on_destroy.push((function(){return f()}));var p=e.feed;d();var m,g=e.config;return s(),m=function(){var t="rssbox-static-stylesheet",e="rssbox-dynamic-stylesheet",n=window[t],r=window[e];n||((n=document.createElement("link")).id=t,n.rel="stylesheet",n.href=ct.app+"/box.css",document.head.appendChild(n)),r||((r=document.createElement("style")).id=e,document.head.appendChild(r)),g.subscribe((function(t){var e=t.linkColor;if(e){var n='.rssbox[data-link-color="'+e+'"] a {\n          color: '+e+";\n        }";r.innerHTML.indexOf(n)<0&&(r.innerHTML+=n)}}))},R().$$.on_mount.push(m),t.$$set=function(t){"feed"in t&&d(n(0,p=t.feed)),"config"in t&&s(n(1,g=t.config))},t.$$.update=function(){4&t.$$.dirty&&n(5,r=c.height&&c.height>-1?c.height+"px":"100%"),4&t.$$.dirty&&n(4,o=c.width?c.width+"px":"100%"),4&t.$$.dirty&&n(3,i=c.compact?"":"bold")},[p,g,c,i,o,r,l]}var Jt=function(t){function e(e){t.call(this),tt(this,e,Gt,Vt,p,{feed:0,config:1},Bt)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(et),Kt={align:"initial",boxFillColor:"#fff",compact:!1,fontFace:"inherit",frameColor:"#000",headless:!1,height:"",linkColor:"",maxItems:7,radius:0,showXmlButton:!1,textColor:"#000",titleBarColor:"#add8e6",titleBarTextColor:"#000",width:"200"},Zt=Object.keys(Kt).concat(["url"]);l((function(){var t=function(t){var e=document.createElement("iframe");document.body.appendChild(e);var n=e.contentWindow[t];return document.body.removeChild(e),n}("Array").prototype.reduce,e=ct.app.replace(/^https?:/,""),n=Array.apply(null,document.querySelectorAll('script[src*="'+e+'"]')),r=[];if(n.forEach((function(e){var n=e.src.split("?")[1];if(n){var o=function(e){var n=e.split("&");return t.call(n,(function(t,e){var n=e.split("="),r=n[0],o=n[1];return Zt.indexOf(r)>-1&&(t[r]=function(t){return"true"===t||"false"!==t&&t}(decodeURIComponent(o))),t}),{})}(n);o.url||(o.url=ct.feed),o=Object.assign({},Kt,o);var i=mt(),c=ht();c.set(o),i.fetch(o.url,i);var l=e.parentNode,a=document.createElement("div");l.insertBefore(a,e),new Jt({target:a,props:{feed:i,config:c}}),e.parentNode.removeChild(e),o.url!==ct.feed&&r.indexOf(o.url)<0&&r.push(o.url)}})),location.href.indexOf(ct.app)<0){var o=JSON.stringify({feedUrls:r});fetch(ct.referrers+"&url="+encodeURIComponent(location.href)+"&metadata="+encodeURIComponent(o))}}))}();
//# sourceMappingURL=box.js.map
