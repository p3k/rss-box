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

  function initializeFeedLink(event) {
    // Only the very first hover should set the initial feed URL – a later
    // re-hover must not reset it. A referrer with more than one feed URL
    // never reaches this at all: its select sits on top of the icon and
    // owns the click/hover there instead (see hasMultipleFeedUrls)
    const link = event.currentTarget;

    if (link.getAttribute("href") !== ".") return;

    const referrer = $referrers[link.dataset.index];
    const data = referrer.metadata;

    if (!data || !data.feedUrls) return;

    link.href = data.feedUrls[0];
  }

  function clickFeedLink(event) {
    event.preventDefault();

    // currentTarget (always the <a> this listener is bound to) rather than
    // target (whatever element hit-testing landed on) – the icon inside is
    // pointer-events: none precisely so clicks resolve to the <a>, but that
    // depends on the browser cascading pointer-events through the SVG
    // correctly, which isn’t worth relying on when currentTarget sidesteps
    // the question entirely
    const link = event.currentTarget;

    if (isFeedLinkDisabled(link.dataset.index)) return;

    // Update the config store with the feed url to load the corresponding rss box
    $config.url = link.href;
  }

  function selectFeedUrl(event) {
    const select = event.currentTarget;
    const link = select.parentElement.querySelector(".feed-link");

    link.href = select.value;
    $config.url = select.value;
  }

  // Checked here rather than relying on the disabled attribute, which does
  // nothing on an <a> in any standards-compliant browser but is uniquely
  // still enforced by IE11 on any element – meaning it silently blocked
  // clicks there even on rows that should have been clickable, since the
  // CSS pointer-events fallback below doesn’t apply to HTML elements in
  // IE11 either
  function isFeedLinkDisabled(index) {
    const referrer = $referrers[index];
    const data = referrer.metadata;

    return !data || !data.feedUrls;
  }

  function hasMultipleFeedUrls(index) {
    const referrer = $referrers[index];
    const data = referrer.metadata;

    return Boolean(data && data.feedUrls && data.feedUrls.length > 1);
  }
</script>

<details id="referrers" on:toggle={load}>
  <summary></summary>
  {#if !Array.isArray($referrers)}
    Loading…
  {:else if $referrers.length}
    {#each $referrers as referrer, index}
      <div class="referrer">
        <code>{format(referrer.percentage)}</code>
        <span class="feed-link-wrapper">
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
          {#if hasMultipleFeedUrls(index)}
            <!-- Covers the icon completely so a click there opens this
                 select’s native dropdown directly, instead of needing its
                 own separate, visible click target next to the icon -->
            <select
              class="feed-select"
              data-index={index}
              on:change={selectFeedUrl}
            >
              {#each referrer.metadata.feedUrls as feedUrl, feedIndex}
                <option value={feedUrl}>{feedIndex + 1}</option>
              {/each}
            </select>
          {/if}
        </span>
        <a href={referrer.url}>{referrer.host}</a>
      </div>
    {/each}
  {:else}
    No referrers yet.
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
    color: #ffa600;
  }

  .feed-link.disabled {
    pointer-events: none;
  }

  /* Carries the position/offset .feed-link itself used to have, so a
     .feed-select absolutely positioned against this wrapper lines up with
     the icon exactly rather than sitting 2px off from its own local
     position: relative offset */
  .feed-link-wrapper {
    display: inline-block;
    position: relative;
    top: 2px;
  }

  .feed-select {
    position: absolute;
    /* stylelint-disable-next-line declaration-block-no-redundant-longhand-properties -- inset isn’t supported in IE11, which this app still targets */
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: none;
    opacity: 0;
    cursor: pointer;
  }

  /* The select itself is invisible (see .feed-select above) – this only
     reaches the options shown in its open dropdown, tying that back to
     the icon’s own color. Browsers vary widely in how much of a native
     select’s open popup can be styled at all (IE11 essentially none of
     it), so this is a best-effort touch rather than full control over it */
  .feed-select option {
    background-color: #ffa600;
    color: #fff;
    font-weight: bold;
  }

  /* Targets every descendant explicitly rather than relying on
     inheritance from the svg rule alone – IE11 has documented
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
