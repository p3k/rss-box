<script>
  import RssIcon from "./RssIcon.svelte";

  // A referrer with more than one feed URL gets this instead of the plain
  // .feed-link icon elsewhere in Referrers.svelte. The options render
  // inline, right in the referrer’s own row, rather than as a popup – a
  // native <select> and a position: fixed popup were both tried first, but
  // either forces the browser to scroll the page to make room for how it
  // renders, something neither CSS nor JS can prevent. Plain inline content
  // never triggers that, since it only ever changes the row’s width, never
  // its height
  export let feedUrls;
  export let onSelect;

  let open = false;
  let selectedIndex = 0;
  let container;

  function toggleOpen() {
    if (open) {
      close();
      return;
    }

    open = true;
    onSelect(feedUrls[selectedIndex]);
  }

  function choose(index) {
    selectedIndex = index;
    onSelect(feedUrls[index]);
  }

  function close() {
    open = false;
  }

  function handleWindowClick(event) {
    if (open && container && !container.contains(event.target)) close();
  }

  function handleWindowKeydown(event) {
    // IE11 reports "Esc" rather than the standard "Escape"
    if (open && (event.key === "Escape" || event.key === "Esc")) close();
  }
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleWindowKeydown} />

<span class="feed-dropdown" bind:this={container}>
  <!-- No whitespace between the trigger and the options below – the gap
       the .feed-dropdown-trigger + .feed-dropdown-option rule adds is
       tuned to line up with the host name in a single-feed row, and a
       stray space here would throw that off -->
  <button
    type="button"
    class="feed-dropdown-trigger"
    aria-expanded={open}
    on:click={toggleOpen}
  >
    <RssIcon />
  </button>{#if open}
    {#each feedUrls as feedUrl, index}
      <!-- class:active would compile to classList.toggle(name, force) –
           IE11 ignores the second “force” argument entirely and just
           flips whatever is already there, so every click would drift
           all the options toward the same state instead of marking only
           one of them active -->
      <button
        type="button"
        class="feed-dropdown-option {index === selectedIndex ? 'active' : ''}"
        title={feedUrl}
        on:click={() => choose(index)}
      >
        {index + 1}
      </button>
    {/each}
  {/if}
</span>

<style>
  /* Matches .feed-link’s own position/offset in Referrers.svelte, so a
     single-feed and a multi-feed referrer line up identically */
  .feed-dropdown-trigger {
    display: inline-block;
    position: relative;
    top: 2px;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: #ffa600;
    font: inherit;
    line-height: 0;
    cursor: pointer;
  }

  /* Same reasoning as .feed-link’s own svg rule in Referrers.svelte: a
     real <button> hit-tests its whole area consistently without this,
     but it costs nothing to stay consistent with the established pattern */
  .feed-dropdown-trigger :global(svg),
  .feed-dropdown-trigger :global(svg *) {
    pointer-events: none;
  }

  .feed-dropdown-option {
    margin: 0 0 0 0.3em;
    padding: 0;
    border: none;
    background: none;
    color: #ccc;
    cursor: pointer;
  }

  /* Matched by measuring a single-feed row’s own icon-to-host-name gap –
     see the template comment above for why this is the only option that
     needs it */
  .feed-dropdown-trigger + .feed-dropdown-option {
    margin-left: 4.45px;
  }

  .feed-dropdown-option:hover {
    text-decoration: underline;
  }

  .feed-dropdown-option.active {
    color: #ffa600;
    font-weight: bold;
  }
</style>
