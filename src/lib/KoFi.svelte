<script>
  export let html;

  const script = document.createElement("script");
  script.async = script.defer = true;
  script.src = "https://storage.ko-fi.com/cdn/widget/Widget_2.js";
  script.onload = () => {
    window.kofiwidget2.init('Support p3k', '#29abe0', 'R5R6NOVK2');
    html = window.kofiwidget2.getHTML();
  };
  document.head.appendChild(script);
</script>

{@html html}
