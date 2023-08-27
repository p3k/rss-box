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

  function load() {
    referrers.fetch();
  }

  function updateFeedLink(event) {
    event.preventDefault();

    const referrer = $referrers[event.target.dataset.index];
    const data = referrer.metadata;

    if (!data || !data.feedUrls) return;

    let feedUrl = event.target.href;
    let index = data.feedUrls.indexOf(feedUrl) + 1;

    if (index >= data.feedUrls.length) index = 0;

    feedUrl = data.feedUrls[index];

    if (event.target.href === feedUrl) return;

    event.target.href = feedUrl;
  }

  function clickFeedLink(event) {
    event.preventDefault();

    if (event.metaKey) {
      // Cycle through the feedUrls array to allow accessing multiple feed urls via one icon
      updateFeedLink(event);
    } else {
      // Update the config store with the feed url to load the corresponding rss box
      $config.url = event.target.href;
    }
  }

  function getFeedLinkDisabledState(index) {
    const referrer = $referrers[index];
    const data = referrer.metadata;

    if (!data || !data.feedUrls) return "disabled";
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
          class="feed-link"
          disabled={getFeedLinkDisabledState(index)}
          data-index={index}
          on:mouseover|once={updateFeedLink}
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
    position: relative;
    top: 2px;
    color: #ffa600;
  }

  .feed-link[disabled] {
    pointer-events: none;
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .feed-link :global(svg) {
    pointer-events: none;
  }

  /* stylelint-disable-next-line selector-pseudo-class-no-unknown */
  .feed-link[disabled] :global(svg) {
    color: #ddd;
  }
</style>
