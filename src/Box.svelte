<script>
  import { onMount } from "svelte";
  import { urls } from "./urls";

  import LinkIcon from "./lib/LinkIcon.svelte";
  import RssIcon from "./lib/RssIcon.svelte";
  import PaperclipIcon from "./lib/PaperclipIcon.svelte";

  // Stores coming in via props
  export let feed;
  export let config;

  onMount(() => {
    const staticId = "rssbox-static-stylesheet";
    const dynamicId = "rssbox-dynamic-stylesheet";

    let staticCss = window[staticId];
    let dynamicCss = window[dynamicId];

    if (!staticCss) {
      staticCss = document.createElement("link");
      staticCss.id = staticId;
      staticCss.rel = "stylesheet";
      staticCss.href = `${urls.app}/assets/box.css`;
      document.head.appendChild(staticCss);
    }

    if (!dynamicCss) {
      dynamicCss = document.createElement("style");
      dynamicCss.id = dynamicId;
      document.head.appendChild(dynamicCss);
    }

    config.subscribe(state => {
      const color = state.linkColor;

      if (!color) return;

      let rule = `.rssbox[data-link-color="${color}"] a {
          color: ${color};
        }`;

      if (dynamicCss.innerHTML.indexOf(rule) < 0) dynamicCss.innerHTML += rule;
    });
  });

  const kb = bytes => `${(bytes / 1000).toFixed(2)}\u200akB`;

  function load(data) {
    return new Promise(fulfill => {
      const image = new Image();

      image.onload = () => {
        const maxWidth = Math.min(100, image.width);
        const factor = image.width > maxWidth ? maxWidth / image.width : 1;

        fulfill({
          width: `${image.width * factor}px`,
          height: `${image.height * factor}px`
        });
      };

      image.src = data.source;
    });
  }

  $: height =
    $config.height && $config.height > -1 ? `${$config.height}px` : "100%";
  $: width = $config.width ? `${$config.width}px` : "100%";
  $: itemTitleClass = !$config.compact ? "bold" : "";
</script>

<div
  data-link-color={$config.linkColor}
  class="rssbox rssBox"
  style="
    max-width: {width};
    border-color: {$config.frameColor};
    border-radius: {$config.radius}px;
    font: {$config.fontFace};
    float: {$config.align};
  "
>
  {#if !$config.headless}
    <div
      class="rssbox-titlebar"
      style="
        color: {$config.titleBarTextColor};
        background-color: {$config.titleBarColor};
        border-bottom-color: {$config.frameColor};
      "
    >
      {#if $config.showXmlButton}
        <div class="rssbox-icon">
          <a
            href={$config.url}
            title="{$feed.format} {$feed.version}"
            style="color: {$config.titleBarTextColor}"
          >
            <RssIcon />
          </a>
        </div>
      {/if}
      <div>
        <a href={$feed.link} style="color: {$config.titleBarTextColor};">
          {$feed.title}
        </a>
      </div>
      <div class="rssbox-date">
        {feed.formatDate($feed.date)}
      </div>
    </div>
  {/if}

  <div
    class="rssbox-content rssBoxContent"
    style="background-color: {$config.boxFillColor}; height: {height};"
  >
    {#if $feed.image && !$config.compact}
      {#await load($feed.image) then image}
        <a href={$feed.image.link} title={$feed.image.title}>
          <div
            alt={$feed.image.description}
            class="rssbox-image"
            style="
              background-image: url({$feed.image.source});
              width: {image.width};
              height: {image.height};
            "
          />
        </a>
      {/await}
    {/if}

    {#each $feed.items as item, index}
      {#if index < $config.maxItems}
        <div
          class="rssbox-item-content rssBoxItemContent"
          style="color: {$config.textColor}"
        >
          {#if item.title}
            <div class="rssbox-item-title {itemTitleClass}">
              {#if item.link}
                <a href={item.link}>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html item.title}
                </a>
              {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html item.title}
              {/if}
            </div>
          {/if}

          {#if !$config.compact}
            <aside>
              {#if item.source}
                <a
                  href={item.source.url}
                  title={item.source.title}
                  class="rssbox-source"
                >
                  {#if item.source.url.endsWith(".xml")}
                    <RssIcon />
                  {:else}
                    <LinkIcon />
                  {/if}
                </a>
              {/if}

              {#if item.enclosures}
                {#each item.enclosures as enclosure}
                  <a
                    href={enclosure.url}
                    title="{kb(enclosure.length)} {enclosure.type}"
                    class="rssbox-enclosure"
                  >
                    <PaperclipIcon />
                  </a>
                {/each}
              {/if}
            </aside>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html item.description}
          {/if}
        </div>
      {/if}
    {/each}

    {#if $feed.input}
      <form class="rssbox-form" method="get" action={$feed.input.link}>
        <input
          type="text"
          name={$feed.input.name}
          placeholder="Enter search &amp; hit return…"
          data-placeholder={$feed.input.description}
        />
      </form>
    {/if}
    <div class="rssbox-promo rssBoxPromo">
      <a href={urls.app} style="color: {$config.textColor}">
        RSS Box by p3k.org
      </a>
    </div>
  </div>
</div>

<style>
  .rssbox {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #000;
    font-family: sans-serif;
    overflow: hidden;
    border-radius: 0;
    -moz-border-radius: 0; /* stylelint-disable-line property-no-vendor-prefix */
  }

  .rssbox-icon {
    float: right;
    width: 1em;
    margin-left: 0.5em;
  }

  .rssbox-titlebar {
    padding: 0.5em;
    color: #000;
    background-color: #add8e6;
    border-bottom: 1px solid #000;
    font-weight: bold;
    letter-spacing: 0.01em;
  }

  .rssbox-date {
    margin-top: 0.2em;
    font-size: 0.8em;
    font-weight: normal;
  }

  .rssbox-content {
    height: auto;
    padding: 0.5em;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #fff;
    clear: both;
    -ms-overflow-style: -ms-autohiding-scrollbar;
  }

  .rssbox-content aside {
    clear: both;
    float: right;
  }

  .rssbox-content aside a {
    display: block;
    margin-left: 0.5em;
  }

  .rssbox-image {
    float: right;
    margin: 0 0 0.5em 0.5em;
    background-position: left center;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .rssbox-item-title.bold {
    font-weight: bold;
  }

  .rssbox-enclosure,
  .rssbox-source {
    display: block;
    width: 1em;
  }

  .rssbox-form {
    margin-bottom: 0.8em;
  }

  .rssbox-form input {
    padding: 0.5em;
    background-color: #fff;
  }

  .rssbox-promo {
    text-align: right;
    font-size: 0.7em;
    letter-spacing: 0.01em;
  }
</style>
