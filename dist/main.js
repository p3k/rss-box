!function(){"use strict";var r={app:"https://p3k.org/rss",proxy:"https://p3k-services.appspot.com/roxy",referrers:"https://p3k-services.appspot.com/roxy/ferris?group=rssbox",default:"https://blog.p3k.org/stories.xml"}||{},s="http://localhost",e={app:s+":5000",proxy:s+":8080/roxy",referrers:s+":8080/ferris?group=rssbox",default:"https://blog.p3k.org/stories.xml"};for(var p in e)p in r&&(e[p]=r[p]);var o="__rssbox_viewer_"+"19.12.10".replace(/\D/g,"_")+"_init__";if(!window[o]){window[o]=!0;var t=document.createElement("script");t.defer=t.async=!0,t.src=e.app+"/box.js",document.head.appendChild(t)}}();
//# sourceMappingURL=main.js.map
