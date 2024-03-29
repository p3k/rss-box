<script>
  import { app } from "../stores";
  import Changes from "./Changes.svelte";
  import Github from "./Github.svelte";
  import KoFi from "./KoFi.svelte";

  // Stores coming in via props
  export let config;

  function goto() {
    event.preventDefault();
    config.set({ url: event.target.href });
  }

  app.subscribe(state => (document.title = state.description));
</script>

<div>
  <small>
    <i>
      “JavaScript RSS Viewer puts little or long customizable RSS boxes anywhere
      you put HTML; build your own slashbox hell or heaven, it’s feedarific!” — <a
        href="http://ourpla.net/cgi/pikie"
      >
        Abbe Normal
      </a>
    </i>
  </small>
</div>

<h2>{$app.description} {$app.version}</h2>

<p class="msg warning">
  <strong>This is a non-profit project running on a private server.</strong>
  If you like using it you should
  <a href="https://github.com/p3k/rss-box/blob/main/INSTALL.md">
    host an installation on your own server
  </a>
  and/or support the project with your
  <a href="https://ko-fi.com/p3kofi">donation</a>.
</p>

<p>
  This viewer can display <a href="http://en.wikipedia.org/wiki/RSS">RSS</a>
  feeds of version
  <a
    href="http://cyber.law.harvard.edu/rss/examples/sampleRss091.xml"
    on:click={goto}>0.91</a
  >,
  <a
    href="http://cyber.law.harvard.edu/rss/examples/sampleRss092.xml"
    on:click={goto}>0.92</a
  >,
  <a href="http://rss.orf.at/fm4.xml" on:click={goto}>1.0</a>
  and
  <a href="http://blog.p3k.org/stories.xml" on:click={goto}>2.0</a>
  as well as even the good old legacy format
  <a
    href="http://essaysfromexodus.scripting.com/xml/scriptingNews2.xml"
    on:click={goto}>Scripting News 2</a
  >. There is also basic support for
  <a href="https://www.theregister.co.uk/headlines.atom" on:click={goto}
    >Atom 1.0</a
  >.
</p>

<p>
  It provides a simple way to embed such RSS boxes in any <a
    href="http://validator.w3.org/"
  >
    valid HTML document
  </a>
  via an automagically generated JavaScript tag —
  <i>for free!</i>
</p>

<p>
  Just enter the URL of any compatible RSS feed, modify the layout settings as
  you like and push the Reload button. When finished, copy the HTML code into
  your own web page – and voilà!
</p>

<p>
  The code behind this is written in JavaScript and runs completely in your
  browser*. You can get the source code together with all the other necessary
  files from the <a href="https://github.com/p3k/rss-box">Github repository</a>.
</p>

<p>
  <small>* A proxy server is needed for cross-origin requests.</small>
</p>

<p>
  <KoFi />
</p>

<Changes />

<h3>Future Development</h3>

<p>
  I have ceased actively developing this viewer but sometimes I get enthusiastic
  and fiddle around with the code. Of course it will be available here as is.
</p>
<p>
  For questions and comments feel free to contact me (Tobi) via e-mail: <a
    href="mailto:&#109;&#97;&#105;&#108;&#43;&#114;&#115;&#115;&#64;&#112;&#51;&#107;&#46;&#111;&#114;&#103;"
    >&#109;&#97;&#105;&#108;&#43;&#114;&#115;&#115;&#64;&#112;&#51;&#107;&#46;&#111;&#114;&#103;</a
  >.
</p>
<p>
  <Github />
</p>

<h3>License</h3>

<p>
  <span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">
    JavaScript RSS Box Viewer
  </span>
  by
  <a
    xmlns:cc="http://creativecommons.org/ns#"
    href="http://p3k.org/rss"
    property="cc:attributionName"
    rel="cc:attributionURL"
  >
    Tobi Schäfer
  </a>
  is licensed under a
  <a
    rel="license"
    href="http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US"
    >Creative Commons Attribution-ShareAlike 3.0 Austria License</a
  >.
</p>
<p>
  Based on a work at <a
    xmlns:dct="http://purl.org/dc/terms/"
    href="https://p3k.org/source/svn/rss-box/trunk/"
    rel="dct:source">https://p3k.org/source/svn/rss-box/trunk/</a
  >.
</p>
<p>
  <a
    rel="license"
    href="http://creativecommons.org/licenses/by-sa/3.0/at/deed.en_US"
  >
    <img
      alt="Creative Commons License"
      style="border-width:0"
      src="https://i.creativecommons.org/l/by-sa/3.0/at/88x31.png"
    />
  </a>
</p>

<small>
  Thank you, <a href="https://p3k.org/">p3k.org</a>!
</small>

<style>
  h3 {
    display: inline-block;
  }

  h3 + p {
    margin-top: 0;
  }

  small {
    color: #bbb;
  }

  .warning {
    border-color: #e44;
    background: #fdd;
  }
</style>
