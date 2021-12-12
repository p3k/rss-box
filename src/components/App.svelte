<script>
  import About from "./About.svelte";
  import Ad from "./Ad.svelte";
  import Box from "./Box.svelte";
  import Configurator from "./Configurator.svelte";

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
