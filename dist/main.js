!function(){"use strict";var r={app:"https://p3k.org/rss",proxy:"https://p3k.org/json/roxy",referrers:"https://p3k.org/json/ferris?group=rss-box",feed:"https://blog.p3k.org/stories.xml"},o="http://localhost",t={app:o+":8000",proxy:o+":8000/roxy",referrers:o+":8000/ferris?group=rss-box",feed:"https://blog.p3k.org/stories.xml"};Object.keys(r).forEach((function(o){o in t&&(t[o]=r[o])}));var e,s,p="__rssbox_viewer_"+"23.7.22".replace(/\D/g,"_")+"_init__";window[p]||(window[p]=!0,e=function(){var r=document.createElement("script");r.defer=r.async=!0,r.src=t.app+"/box.js",document.head.appendChild(r)},(s=document.createElement("script")).src="https://cdn.polyfill.io/v3/polyfill.min.js?flags=gated&features="+encodeURIComponent(["fetch","Object.assign","Promise","String.prototype.padStart","String.prototype.startsWith","Array.prototype.fill","Array.from"].join()),s.crossOrigin="anonymous",s.onload=e,document.head.appendChild(s))}();
//# sourceMappingURL=main.js.map
