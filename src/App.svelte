<script>
  import About from "./lib/About.svelte";
  import Ad from "./lib/Ad.svelte";
  import Box from "./Box.svelte";
  import Configurator from "./lib/Configurator.svelte";

  // Stores coming in via props
  export let feed;
  export let config;
</script>

<style>
  .loading {
    opacity: 0;
    transition-property: opacity;
    transition-duration: 3s;
    transition-timing-function: ease-out;
    pointer-events: none;
  }

  *::-ms-backdrop, .loading {
    opacity: 1;
    transition: none;
    pointer-events: initial;
  }
</style>

<div class='row'>
  <div class='col c2' class:loading={ $feed.loading }>
    <Box { feed } { config }/>
  </div>
  <div class='col c5'>
    <Configurator { feed } { config }/>
  </div>
  <div class='col c5'>
    <Ad/>
    <About { config }/>
  </div>
</div>
