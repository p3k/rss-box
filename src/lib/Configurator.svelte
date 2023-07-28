<script>
  import { urls } from "../urls";

  import Referrers from "./Referrers.svelte";

  // Stores coming in via props
  export let feed;
  export let config;

  function validate(event) {
    event.preventDefault();
    if (!event.target.checkValidity()) event.target.reportValidity();
  }

  function reload(event) {
    event.preventDefault();
    // The app’s subcription only triggers a fetch when the url has changed
    config.set({ url: null });
    config.set({ url: document.querySelector('input[name="url"]').value });
  }

  function copy(event) {
    try {
      event.target.select();
      document.execCommand("copy");
    } catch (error) {
      void error;
    }
  }

  function clickLabel(event) {
    const sibling = event.target.parentNode.nextElementSibling;
    let input = sibling.querySelector("input");
    if (!input) input = sibling.querySelector("summary");
    if (!input) input = sibling.querySelector("textarea");
    if (!input) return;
    if (input.click) input.click();
    if (input.select) input.select();
  }

  function getQuery() {
    const query = [];

    Object.keys($config).forEach(key => {
      let value = $config[key];
      if (value === null || value === undefined) value = "";
      query.push(`${key}=${encodeURIComponent(value)}`);
    });

    return query.join("&");
  }

  function code() {
    const query = getQuery().replace(/&/g, "&amp;");
    // Need to be careful with the script-end-tag to prevent template error
    // See https://github.com/sveltejs/svelte/issues/3840
    return `<script async defer src='${
      urls.app
    }/main.js?${query}'>${"<"}/script>`;
  }
</script>

<form>
  <table class="table">
    <colgroup>
      <col width="*" />
      <col width="90%" />
    </colgroup>
    <tr>
      <td>
        <label for="url">Feed URL</label>
      </td>
      <td>
        <input
          type="url"
          value={$config.url}
          id="url"
          name="url"
          required
          on:change={reload}
        />
      </td>
    </tr>
    <tr>
      <td>Title</td>
      <td>{$feed.title}</td>
    </tr>
    <tr>
      <td class="top">
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
        <label for="description" on:click={clickLabel}>Description</label>
      </td>
      <td>
        <details id="description">
          <summary></summary>
          {$feed.description}
        </details>
      </td>
    </tr>
    <tr>
      <td>Last build</td>
      <td>{feed.formatDate($feed.date)}</td>
    </tr>
    <tr>
      <td>Source</td>
      <td class="source">
        {#if $feed.loading}
          Loading...
        {:else}
          <a href={$config.url}>{$feed.format} {$feed.version}</a>
        {/if}
      </td>
    </tr>
    <tr>
      <td>
        <label for="maxItems">Max. items</label>
      </td>
      <td>
        <input
          type="number"
          id="maxItems"
          name="maxItems"
          bind:value={$config.maxItems}
          min="1"
          max="99"
          required
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="width">Max. width</label>
      </td>
      <td>
        <input
          type="number"
          id="width"
          name="width"
          bind:value={$config.width}
          min="100"
          max="9999"
          on:change={validate}
          placeholder="spare"
        />
        <small>px</small>
      </td>
    </tr>
    <tr>
      <td>
        <label for="height">Content height</label>
      </td>
      <td>
        <input
          type="number"
          id="height"
          name="height"
          bind:value={$config.height}
          min="100"
          max="9999"
          on:change={validate}
          placeholder="spare"
        />
        <small>px</small>
      </td>
    </tr>
    <tr>
      <td>
        <label for="radius">Corner radius</label>
      </td>
      <td>
        <input
          type="number"
          id="radius"
          name="radius"
          bind:value={$config.radius}
          min="0"
          max="20"
          required
          on:change={validate}
        />
        <small>px</small>
      </td>
    </tr>
    <tr>
      <td>
        <label for="showXmlButton">RSS button</label>
      </td>
      <td>
        <input
          type="checkbox"
          id="showXmlButton"
          name="showXmlButton"
          value="1"
          bind:checked={$config.showXmlButton}
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="compact">Compact view</label>
      </td>
      <td>
        <input
          type="checkbox"
          id="compact"
          name="compact"
          value="1"
          bind:checked={$config.compact}
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="headless">Headless</label>
      </td>
      <td>
        <input
          type="checkbox"
          id="headless"
          name="headless"
          value="1"
          bind:checked={$config.headless}
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="frameColor">Frame color</label>
      </td>
      <td>
        <input
          type="color"
          id="frameColor"
          name="frameColor"
          bind:value={$config.frameColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="titleBarColor">Titlebar color</label>
      </td>
      <td>
        <input
          type="color"
          id="titleBarColor"
          name="titleBarColor"
          bind:value={$config.titleBarColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="titleBarTextColor">Title color</label>
      </td>
      <td>
        <input
          type="color"
          id="titleBarTextColor"
          name="titleBarTextColor"
          bind:value={$config.titleBarTextColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="boxFillColor">Box color</label>
      </td>
      <td>
        <input
          type="color"
          id="boxFillColor"
          name="boxFillColor"
          bind:value={$config.boxFillColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="textColor">Text color</label>
      </td>
      <td>
        <input
          type="color"
          id="textColor"
          name="textColor"
          bind:value={$config.textColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="linkColor">Link color</label>
      </td>
      <td>
        <input
          type="color"
          id="linkColor"
          name="linkColor"
          bind:value={$config.linkColor}
          size="6"
          maxlength="7"
          on:change={validate}
        />
      </td>
    </tr>
    <tr>
      <td>
        <label for="fontFace">Font face</label>
      </td>
      <td>
        <input
          id="fontFace"
          name="fontFace"
          bind:value={$config.fontFace}
          on:change={validate}
          pattern="[\d.]+(?:pt|px|em|%)+\s+[\s\w\-,]+"
          placeholder="e.g. 10pt Helvetica, sans-serif"
        />
      </td>
    </tr>
    <tr>
      <td></td>
      <td>
        {#if $feed.loading}
          <button class="btn btn-sm btn-c" disabled>Loading...</button>
        {:else}
          <button class="btn btn-sm btn-b" on:click={reload}>Reload</button>
        {/if}
      </td>
    </tr>
    <tr style="vertical-align: top">
      <td>
        <label for="code">
          HTML code
          <br />
          (copy&amp;pasta)
        </label>
      </td>
      <td>
        <textarea
          id="code"
          name="code"
          cols="10"
          rows="3"
          readonly
          on:click={copy}
        >
          {code($config)}
        </textarea>
      </td>
    </tr>
    <tr>
      <td class="top">
        <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
        <label
          for="referrers"
          on:click={clickLabel}
          title="since midnight (GMT)"
        >
          Referrers
        </label>
      </td>
      <td class="top">
        <Referrers {config} />
      </td>
    </tr>
  </table>
</form>

<style>
  table {
    overflow: auto;
  }

  tr td:first-child {
    color: #bbb;
    text-align: right;
    white-space: nowrap;
  }

  summary {
    outline: none;
  }

  button {
    width: 7em;
    height: 2.5em;
    padding: initial;
    box-sizing: border-box;
  }

  .top {
    vertical-align: top;
  }

  .source {
    line-height: 1em;
  }

  [name="url"],
  [name="fontFace"],
  [name="code"] {
    width: 90%;
    height: 2.5em;
    box-sizing: border-box;
  }

  [type="color"],
  [type="number"] {
    width: 7em;
    height: 2.5em;
    box-sizing: border-box;
  }

  input[type="color"] {
    padding: 3px;
  }

  [name="code"] {
    color: #bbb;
    height: 10em;
    overflow: hidden;
    resize: vertical;
  }
</style>
