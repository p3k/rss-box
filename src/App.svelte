<script>
  import About from "./lib/About.svelte";
  import Ad from "./lib/Ad.svelte";
  import Box from "./Box.svelte";
  import Configurator from "./lib/Configurator.svelte";

  // Stores coming in via props
  export let feed;
  export let config;
</script>

<div class="row">
  <div class="col c2" class:loading={$feed.loading}>
    <Box {feed} {config} />
  </div>
  <div class="col c5">
    <Configurator {feed} {config} />
  </div>
  <div class="col c5">
    <Ad />
    <About {config} />
  </div>
</div>

<style>
  .loading {
    opacity: 0;
    transition-property: opacity;
    transition-duration: 3s;
    transition-timing-function: ease-out;
    pointer-events: none;
  }

  /**
   * Disable transition in IE 11 because it runs *after* the RSS data has loaded 🤷
   * Source: <https://gist.github.com/feo52/9b0658d254b0ad2333d6907e97267e5f>
   */
  *::-ms-backdrop,
  .loading {
    opacity: 1;
    transition: none;
    pointer-events: initial;
  }
</style>
