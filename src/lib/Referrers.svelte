<script>
  import { onMount } from "svelte";
  import { referrers } from "../stores";

  import RssIcon from "./RssIcon.svelte";

  // Stores coming in via props
  export let config;

  onMount(() => {
    if ("open" in document.createElement("details") === false) {
      load();
    }
  });

  function format(float) {
    if (float < 0.01) return "< 0.01";
    return float.toFixed(2).padStart(6);
  }

  function load(event) {
    // Closing the list does not call for fresh data
    if (event && !event.target.open) {
      return;
    }

    referrers.fetch();
  }

  function updateFeedLink(event) {
    event.preventDefault();

    // currentTarget (always the <a> this listener is bound to) rather than
    // target (whatever element hit-testing landed on) — the icon inside is
    // pointer-events: none precisely so clicks resolve to the <a>, but that
    // depends on the browser cascading pointer-events through the SVG
    // correctly, which isn't worth relying on when currentTarget sidesteps
    // the question entirely
    const link = event.currentTarget;
    const referrer = $referrers[link.dataset.index];
    const data = referrer.metadata;

    if (!data || !data.feedUrls) return;

    let feedUrl = link.href;
    let index = data.feedUrls.indexOf(feedUrl) + 1;

    if (index >= data.feedUrls.length) index = 0;

    feedUrl = data.feedUrls[index];

    if (link.href === feedUrl) return;

    link.href = feedUrl;
  }

  function initializeFeedLink(event) {
    // Only the very first hover should set the initial feed URL — a
    // later re-hover must not cycle it forward again, that's meta-click's
    // job. Svelte's |once event modifier relies on the native
    // addEventListener options object ({ once: true }), which IE11 never
    // implemented at all — checking the actual attribute here does the
    // same job without depending on that.
    if (event.currentTarget.getAttribute("href") !== ".") return;
    updateFeedLink(event);
  }

  function clickFeedLink(event) {
    event.preventDefault();

    const link = event.currentTarget;

    if (isFeedLinkDisabled(link.dataset.index)) return;

    if (event.metaKey) {
      // Cycle through the feedUrls array to allow accessing multiple feed urls via one icon
      updateFeedLink(event);
    } else {
      // Update the config store with the feed url to load the corresponding rss box
      $config.url = link.href;
    }
  }

  // Checked here rather than relying on the disabled attribute, which does
  // nothing on an <a> in any standards-compliant browser but is uniquely
  // still enforced by IE11 on any element — meaning it silently blocked
  // clicks there even on rows that should have been clickable, since the
  // CSS pointer-events fallback below doesn't apply to HTML elements in
  // IE11 either
  function isFeedLinkDisabled(index) {
    const referrer = $referrers[index];
    const data = referrer.metadata;

    return !data || !data.feedUrls;
  }
</script>

<details id="referrers" on:toggle={load}>
  <summary></summary>
  {#if $referrers.length}
    {#each $referrers as referrer, index}
      <div class="referrer">
        <code>{format(referrer.percentage)}</code>
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <a
          href="."
          class="feed-link {isFeedLinkDisabled(index) ? 'disabled' : ''}"
          data-index={index}
          on:mouseover={initializeFeedLink}
          on:click={clickFeedLink}
        >
          <RssIcon />
        </a>
        <a href={referrer.url}>{referrer.host}</a>
      </div>
    {/each}
  {:else}
    Loading…
  {/if}
</details>

<style>
  details {
    line-height: 1.2em;
  }

  code {
    margin-right: 0.3em;
    color: #bbb;
    font-size: 0.7em;
    white-space: pre;
  }

  summary {
    outline: none;
    color: #bbb;
  }

  .referrer {
    max-width: 20rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .feed-link {
    display: inline-block;
    position: relative;
    top: 2px;
    color: #ffa600;
  }

  .feed-link.disabled {
    pointer-events: none;
  }

  /* Targets every descendant explicitly rather than relying on
     inheritance from the svg rule alone — IE11 has documented
     inconsistencies inheriting pointer-events through intermediate SVG
     structural elements (RssIcon nests its path inside a <g>), so a real
     click landing on the drawn path pixels could hit-test to the path
     itself rather than being redirected to the <a> underneath */
  .feed-link :global(svg),
  .feed-link :global(svg *) {
    pointer-events: none;
  }

  .feed-link.disabled :global(svg) {
    color: #ddd;
  }
</style>
