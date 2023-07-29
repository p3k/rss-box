<details>
  <summary>
    <h3>Change Log</h3>
  </summary>

  <p>
    <small>2023-07-29</small>
    So I worked a few days on making the Svelte upgrade work – and now got it running
    with version&nbsp;4! 🚀
  </p>
  <p>
    As a bonus, <a
      href="https://github.com/p3k/rss-box/tree/main/dist/box-esm.js"
      >optimized code</a
    >
    for the embedded RSS box is available for “modern” browsers. And don’t worry,
    Internet Explorer 11 remains supported. <i>#helpTheAged</i>
  </p>
  <ul>
    <li>Replaced Bublé with Babel</li>
    <li>Updated min.css</li>
    <li>Added a CSS linter</li>
    <li>Enabled automatic delinting on Git commit</li>
  </ul>

  <p>
    <small>2023-07-22</small>
    Replaced Yarn with NPM, updated all dependencies – except for Svelte, which I
    just cannot get to work with version &gt;3.40.0 🤷 – and made sure, HTML videos
    are nicely displayed in the RSS box.
  </p>

  <p>
    <small>2021-12-11</small>
    Dependency updates and cosmetics.
  </p>

  <p>
    <small>2021-05-16</small>
    Just some minor dependency updates and a11y fixes.
  </p>

  <p>
    <small>2020-11-20</small>
    Because
    <a href="https://cloud.google.com/appengine/">Big G is monetizing</a>
    (if not fully abandoning) one project serving the common good after another,
    I rewrote the
    <a href="https://github.com/p3k/json3k">JSONP services for mod_wsgi</a>
    to run on my own server from now on. Not much news on the front-end side, just
    the usual dependency upgrade and some minor fixes. I hope everything works as
    it should be and wish everyone all the best, especially to those who need it
    most in these pandemic times.
  </p>

  <p>
    <small>2020-01-06</small>
    Not sure how it really happened but I got pretty much immersed into working on
    this project during the holiday season… So now we got:
  </p>
  <ul>
    <li>Better caching support for feeds and referrers</li>
    <li>
      RSS icon next to referrer directly linking its feed URL (if available) to
      this app
    </li>
    <li>Upgrade to Svelte 3 (which was rather tedious) 😰</li>
    <li>
      Re-established support for older browsers (looking at you, Internet
      Explorer 11) 👴
    </li>
    <li>
      Multiple small fixes and improvements, take a look at the <a
        href="https://github.com/p3k/rss-box/commits/master"
      >
        commit log
      </a>
      for details
    </li>
  </ul>

  <p>
    <small>2019-12-15</small>
    Upgraded the JSONP proxy to Python 3.7 and slightly retouched the configuration
    form. A merry ending for 2019 and a happy new year 🎉
    <em>
      It’s hindsight!
      <em></em>
    </em>
  </p>

  <p>
    <small>2018-01-19</small>
    More than 15 years (and still counting…) after its inception this little service
    is still live and kicking! The best part of this hobby project’s long-running
    trait: this year brings a complete rewrite and overhaul with an extensive list
    of updates – and only small changes in functionality:
  </p>
  <ul>
    <li>Added basic support for Atom 1.0 feeds 🔥</li>
    <li>Added support for multiple enclosures (RSS 0.93)</li>
    <li>
      Replaced value of -1 for automatic content height with “empty” value
    </li>
    <li>
      Added support for “empty” value to box width (now called ”max. width”)
    </li>
    <li>Reduced total size of embedded download by more than 60% ⚡</li>
    <li>Increased performance of loading and rendering boxes</li>
    <li>Implemented responsive CSS for both, boxes and configuration app</li>
    <li>Replaced bitmap icons with scalable vector graphics</li>
    <li>
      Completely rewrote the app code using <a href="https://svelte.technology">
        Svelte
      </a>
      and
      <a href="https://mincss.com/">min.css</a>
    </li>
    <li>Replaced remaining jQuery code with vanilla JavaScript</li>
    <li>Migrated build scripts to Rollup and Yarn</li>
    <li>
      Added support for missing browser features via <a
        href="https://polyfills.io"
      >
        polyfills.io
      </a>
    </li>
    <li>Discontinued support for older browsers (MSIE &lt; 11)</li>
    <li>
      Bumped major version to 18 (aka the year), getting rid of semantic
      versioning due to lack of semantics 🐱
    </li>
  </ul>

  <p>
    <small>2016-03-12</small>
    Completely rewrote build environment using WebPack. Switched the
    <a href="https://github.com/p3k/rss-box">source repository</a>
    from SVN to Git, hosted at Github. This deserves a new major version number!
  </p>

  <p>
    <small>2012-12-30</small>
    Added simple code to modify the width attribute of iframe, object and embed elements
    to make them fit in the box. Also: bumped version.
    <i>A happy new year 2013, everbody!</i>
  </p>

  <p>
    <small>2012-10-26</small>
    Added section about Creative Commons License, below. In other words: you can
    now legally run my code on your own server. (You even could remove the tiny reference
    to this page in the footer of the box.) However, I would like to ask you for
    two things if you want to do so:
  </p>
  <ul>
    <li>
      Use your own <a href="https://github.com/p3k/json3k">JSONP proxy</a>
      – especially, when you expect a high load on your server.
    </li>
    <li>
      Please support the service with a <a
        href="http://flattr.com/thing/681881/JavaScript-RSS-Box-Viewer"
      >
        donation
      </a>.
    </li>
  </ul>

  <p>
    <small>2012-08-01</small>
    Added two new, experimental features – and thus, increased version to 3.3:
  </p>
  <ul>
    <li>
      The height of the inner box content can now be defined by a pixel value.
      If the height is less than the space needed by the desired amount of items
      you can vertically scroll the content. A value of <code>-1</code>
      enables the default behavior and automatically sets the height according to
      the displaying items.
    </li>
    <li>
      The so-called “headless” mode removes the titlebar and the frame from the
      box. This way the box can be used more flexibly in special situations.
      However, this feature somehow undermines an RSS feed’s authority so I
      count on your fairness to give credit where credit is due!
    </li>
  </ul>

  <p>
    <small>2012-07-16</small>
    Slightly modified output of the HTML code to be usable with both, unsecured and
    secured (HTTPS) web servers. You can update already embedded code easily by removing
    the
    <code>http:</code>
    part from the
    <code>src</code>
    attribute of the
    <code>&lt;script&gt;</code>
    element:
    <code>&lt;script src='http://p3k.org/rss…'&gt;</code>
    becomes
    <code>&lt;script src='//p3k.org/rss…'&gt;</code>.
  </p>

  <p>
    <small>2012-07-13</small>
  </p>
  <ul>
    <li>
      Fixed IE bug (“innerHTML is null or not an object”) caused by using
      jQuery’s html() method instead of text() when parsing a <code>
        &lt;content:encoded&gt;
      </code>
      element.
    </li>
    <li>
      Changed priority of elements: only check for <code>
        &lt;content:encoded&gt;
      </code>
      if
      <code>&lt;description&gt;</code>
      is not available.
    </li>
  </ul>

  <p>
    <small>2012-06-04</small>
  </p>
  <ul>
    <li>
      Implemented small routine to resize images contained in the feed content
      to fit in the box.
    </li>
    <li>Added support for new HTML5 form input types and their validation.</li>
  </ul>

  <p>
    <small>2012-05-31</small>
    Gone &beta;eta! – with three tiny additons:
  </p>
  <ul>
    <li>
      Added <code>&lt;noscript&gt;</code>
      element for browsers providing no JavaScript engine.
    </li>
    <li>
      Added option to call the configurator with a URL in the query string.
    </li>
    <li>
      Added a link to the W3C feed validator to the contents of a box displaying
      an RSS error.
    </li>
  </ul>

  <p>
    <small>2012-05-19</small>
    Apologies for the RSS Boxes not showing up on your pages during the last few
    days. I made a stupid mistake that caused only the setup page to render correctly
    – and I did not check any embedded script.
    <i>Bummer!</i>
  </p>
  <p>
    At least now everything should be back to normal. (I hope this incident did
    not sabotage the Flattr button I added in the meantime… <i>wink, wink!</i>
    )
  </p>
  <p>Anyway, thanks for your understanding.</p>

  <p>
    <small>2012-05-16</small>
    I think I did not mention, yet, that the current incarnation of the code is totally
    disconnected from the version as of 2009. Each is using their own codebase, the
    legacy code was not modified at all and thus, it is not affected by any recent
    changes. You can check which version you are using by looking at the script URL.
    If it contains the string “proxy.r” you get the “classic” RSS Box rendering.
    The modernized version calls “index.js”. Nevertheless, you cannot setup boxes
    with the old URL anymore.
  </p>

  <p>
    <small>2012-05-09</small>
  </p>
  <ul>
    <li>
      Added support for <code>&lt;content:encoded&gt;</code>
      element.
    </li>
    <li>Implemented Memcache usage in AppEngine code.</li>
    <li>
      Beautified this page by using the <a
        href="http://www.google.com/webfonts/specimen/Droid+Serif"
      >
        Google’s Droid Serif font
      </a>.
    </li>
  </ul>

  <p>
    <small>2012-04-26</small>
    Amazing! A new version! After more than two years hiatus I completely rewrote
    the codebase and framework:
  </p>
  <ul>
    <li>
      Removed dependency to Rebol using a small JSONP proxy at Google’s
      AppEngine.
    </li>
    <li>Rewrote XML parsing, replacing native methods with jQuery ones.</li>
    <li>
      Cleaned up HTML output for the RSS Box, replacing tables with divs. <i>
        Note: You might need to add <code>
          <a
            href="http://coding.smashingmagazine.com/2010/11/02/the-important-css-declaration-how-and-when-to-use-it/"
          >
            !important
          </a>
        </code>
        to your custom RSS Box stylesheet definitions.
      </i>
    </li>
    <li>
      Replaced fugly colorpicker in configurator with the <a
        href="https://github.com/claviska/jquery-miniColors/"
      >
        MiniColors jQuery plugin
      </a>.
    </li>
    <li>
      Added link color setting and style attributes for correctly applying color
      settings.
    </li>
    <li>
      Added corner radius setting. <i>
        Note: does not work in IE8 and earlier versions.
      </i>
    </li>
    <li>Added font size to the font face setting.</li>
    <li>
      Removed align setting from configurator (still works in script tags
      generated with earlier versions).
    </li>
  </ul>

  <p>
    <small>2009-12-13</small>
    Switched output of this page to HTML5 and made some adaptations in the HTML code
    and CSS stylesheet. Updated version string to 2.1, finally!
  </p>

  <p>
    <small>2009-09-28</small>
    Some minor changes after a while:
  </p>
  <ul>
    <li>Refactored date parsing to show actual build dates more reliably</li>
    <li>Refactored caching routine (only in online version)</li>
    <li>Updated version string to 2.1b, approaching another final version.</li>
  </ul>

  <p>
    <small>2008-02-19</small>
    Seems there were some changes in the air as I did not plan another update but
    here comes version 2.1 bringing to you:
  </p>
  <ul>
    <li>
      Full client-side processing (only the raw feed data is fetched from the
      server).
    </li>
    <li>
      User-friendlier interface with color pickers, status and error display as
      well as instant feedback on any change in setup.
    </li>
    <li>
      And finally (drumroll!) Unicode support at least at this installation of
      the viewer. (Ie. the downloaded version still will output ASCII only.)
    </li>
  </ul>

  <p>
    <small>2008-02-03</small>
    Made some more improvements especially regarding the error handling and output.
    From now on it should be much clearer what’s wrong with a very RSS Box. Since
    there’s now a lot more of client-side JavaScript code involved I tested the script
    in four major browsers that are available to me: Internet Explorer 7, Firefox
    2.0, Opera 9.25 and Safari 3.
  </p>

  <p>
    <small>2008-02-01</small>
    Completely revised server- and client-side code. XML rendering is now done in
    the browser which speeds up things and decreases the load on the server. Furthermore,
    the list of referrers is now loaded on demand via AJAX and thus not rendered
    with every request. Finally, I retouched the setup form interface and cleaned
    up both HTML and CSS.
  </p>

  <p>
    <small>2006-12-20</small>
    I am very glad that my old little script is gaining even more attention after
    all these years…
    <i>Thank you very much indeed!</i>
    Since there are coming in more and more of the same requests and I am really
    not able to handle them (apologies!), here is some advice for everyone:
  </p>
  <ol>
    <li>
      <a href="http://en.wikipedia.org/wiki/Cascading_Style_Sheets">
        Use cascading style sheets
      </a>
      (CSS) to change font sizes (and to generally define your layout).
    </li>
    <li>
      <a
        href="http://www.sitepoint.com/article/beware-opening-links-new-window"
      >
        Beware of opening links in a new window.
      </a>
      It’s offensive to your readers.
    </li>
  </ol>
  <p>
    <i>A happy end for 2006!</i>
  </p>

  <p>
    <small>2006-06-13</small>
    Did some minor bug fixing again (amongst others replacing single quotes with
    &apos; and not &quot; entities). Furthermore (and finally), I removed the “RC”
    (as in “Release Candidate”) from the document title…
  </p>

  <p>
    <small>2006-06-12</small>
    Gary informed me that longer feed URLs cause trouble and the feed box will not
    be displayed. That’s in fact a bug, but unfortunately one that cannot be fixed
    so easily. My suggestion is to shorten such URLs at one of the websites around
    that provide such a service, e.g.
    <a href="http://tinyurl.com">tinyurl.com</a>.
  </p>

  <p>
    <small>2006-04-23</small>
    Switched the
    <a href="https://p3k.org/source/rss-box/">source repository</a>
    from CVS to Subversion (SVN).
  </p>

  <p>
    <small>2006-04-20</small>
    Andrew Pam brought up a serious issue that probably might have affected some
    more people already: the viewer does not support UTF-8 (or Unicode, resp.) Unfortunately,
    this is “built-in” into the underlying scripting language (aka Rebol). I’m sorry
    to cancel those tickets… :(
  </p>

  <p>
    <small>2006-04-13</small>
    Fixed a bug reported by Mando Gomez that caused feeds using the &lt;guid&gt;
    element being displayed without item links… Don’t forget to check out Mando’s
    excellent website
    <a href="http://www.mandolux.com/">mandolux</a>!
  </p>

  <p>
    <small>2006-04-12</small>
    Obviously Sam Ruby changed his feed format from scriptingNews to Atom; which
    renders my example link above pretty useless… So far I don’t know about any other
    scriptingNews feed, do you?
  </p>

  <p>
    <small>2006-02-20</small>
    I hope nobody minds the little line I added at the bottom of each RSS box… Of
    course, it’s not totally altruistic, but probably some people will find it informative.
    However, if you want to prevent it from being displayed simply add
    <code>.rssbox-promo {"{"}display: none;{"}"}</code>
    to your stylesheet.
  </p>

  <p>
    <small>2006-01-11</small>
    New server, new troubles: I moved the viewer to a newly setup Ubuntu machine.
    Of course, I forgot to set some permission flags and owners, thus, preventing
    the script from working. However, I think everything is fixed and working again.
  </p>

  <p>
    <small>2005-11-16</small>
    Just testing Google’s AdSense for a while. Since this page generates most of
    my traffic I wanted to see myself what a banner can do here. Hope you don’t mind.
  </p>

  <p>
    <small>2004-12-16</small>
    Bugfix: Sometimes the logfile which is used to generate the list of sites using
    this script gets corrupted. This affected the whole setup page to return an error
    and thus, it needed to be caught. (You will see a “currently out of order” message
    then.)
  </p>

  <p>
    <small>2004-04-26</small>
    Last efforts to officially release the
    <a href="https://p3k.org/source/rss-box">code</a>
    to the open source community. There have been some bugs in the (image) rendering
    framework which I fixed so far. I now include a dynamically rendered list of
    sites using (or pointing to) this script to give some examples for the curious
    at heart (me included). Finally, there’s a
    <a href="https://p3k.org/source/rss-box/branches/2.0/README">README</a>
    file with a short installation guide to make the script run on your own server.
  </p>

  <p>
    <small>2004-01-28</small>
    When something goes wrong (most of the time this might be a wrong URL, ie. a
    404 as result) an
    <a href="./?url=error">“error” box</a>
    will be displayed to signal the failure. Increased version up to 1.0 and labeled
    it as release candidate (RC).
  </p>

  <p>
    <small>2004-01-26</small>
    Retouched the code in a very last effort to make the script running stand-alone
    (with Rebol but
    <i>without</i>
    PHP, that is). Everything needed is now in
    <del>CVS</del>
    SVN so everybody can download from there. Potentially, a few minor bug fixes
    might follow short-term. Uh, and the HTML code is
    <a href="http://validator.w3.org/check?uri=http%3A%2F%2Fp3k.org%2Frss%2F">
      valid XHTML 1.0
    </a>
    now.
  </p>

  <p>
    <small>2003-12-12</small>
    The mirror at
    <del>http://publish.curry.com/rss/</del>
    is not working for quite a long time. I tried to contact Adam Curry but so far
    without success.
  </p>

  <p>
    <small>2003-03-30</small>
    Moved to new server with new domain
    <del>forever.p3k.org</del>.
  </p>

  <p>
    <small>2003-03-25</small>
    Updated Rebol to
    <a href="http://www.rebol.com/news3310.html">version 2.5.5</a>. End of
    Rebol’s “DNS zombies” in the process list.
    <i>Finally.</i>
  </p>

  <p>
    <small>2002-02-19</small>
    Added a very nice quote from
    <a href="http://www.ourpla.net/cgi-bin/pikie.cgi?AbbeNormal">Abbe Normal</a>
    on top right of this document.
  </p>

  <p>
    <small>2001-11-17</small>
    If you want a more compact view of the RSS box you can get it now using the corresponding
    checkbox. If it is enabled the descriptions of each item will not be displayed
    &#8211; given that the item title is defined (otherwise there would not be much
    to see). Additionally, the channel image (if defined) will not be displayed.
    Thanks &#106;&#115;&#121;&#101;&#111;&#64;&#99;&#111;&#109;&#112;&#117;&#115;&#101;&#114;&#118;&#101;&#46;&#99;&#111;&#109;
    for the suggestions!
  </p>

  <p>
    <small>2001-09-21</small>
    Since today the
    <code>textinput</code>
    tag is supported. It creates an appropriate form at the end of the box. Moreover,
    two bugs were fixed: one caused unnecessary information in the query string of
    the generated JavaScript tag. The other affected the display of the date’s time
    zone. Time zones now are generally displayed in GMT except where another time
    zone acronym is defined.
  </p>

  <p>
    <small>2001-09-04</small>
    Added icons for enclosure and source; added XML button checkbox to enable output
    of the quasi-standard orange button linking to the XML source (ideaby &#97;&#100;&#97;&#109;&#64;&#99;&#117;&#114;&#114;&#121;&#46;&#99;&#111;&#109;).
  </p>

  <p>
    <small>2001-09-03</small>
    It’s now possible to refine the style of the whole box using the newly implemented
    css classes
    <code>rssbox-title</code>,
    <code>rssbox-content</code>,
    <code>rssbox-item-title</code>
    and
    <code>rssbox-ttem-content</code>
    (idea by &#114;&#100;&#97;&#118;&#105;&#101;&#115;&#64;&#111;&#114;&#105;&#101;&#110;&#116;&#112;&#97;&#99;&#105;&#102;&#105;&#99;&#46;&#99;&#111;&#109;).
  </p>

  <p>
    <small>2001-08-24</small>
    Added a form input for limiting the item display. The number determines how many
    items will be shown in the box (seven is the default value). Good for often updated
    channels.
  </p>

  <p>
    <small>2001-08-15</small>
    Detected a strange bug that prevented the viewer at
    <a href="http://publish.curry.com/rss/">curry.com</a>
    loading http://p3k.org/rss.xml while http://www.p3k.org/rss.xml was no problem
    at all. Upgrading the Rebol installation to the current version solved theproblem,
    however the cause remains unclear…
  </p>

  <p>
    <small>2001-08-08</small>
    Fixed a small bug that corrupted channel URLs containing a query (as reported
    by &#107;&#105;&#107;&#97;&#64;&#115;&#108;&#111;&#108;&#101;&#104;&#116;&#46;&#101;&#101;).
    Configured server redirect from
    <del>http://piefke.helma.at/rss</del>.
  </p>

  <p>
    <small>2001-08-05</small>
    Thanks to
    <a href="http://www.curry.com/2001/07/31#coolRssService">Adam Curry</a>, the
    viewer is now mirrored at
    <del>http://publish.curry.com/rss</del>.
  </p>

  <p>
    <small>2001-07-30</small>
    Added link to source code; added example links for all supported formats.
  </p>

  <p>
    <small>2001-05-30</small>
    Fixed a little bug reported by &#102;&#114;&#101;&#100;&#105;&#64;&#101;&#109;&#97;&#105;&#108;&#46;&#101;&#101;
    that caused diacritic characters to be displayed as entity codes.
  </p>
</details>

<style>
  h3 {
    display: inline-block;
  }

  summary + * {
    margin-top: 0;
  }

  summary {
    outline: none;
  }

  li + li {
    margin-top: 0.5em;
  }

  small {
    display: inline-block;
    margin-right: 0.5em;
    color: #bbb;
  }

  code {
    background-color: #ffc;
    font-size: 0.8em;
    font-weight: 200;
  }
</style>
