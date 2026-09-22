import { urls } from "./urls";

const defaultError = {
  loading: false,
  format: "Error",
  version: "⚡",
  title: "RSS Box Error",
  description:
    "This output was automatically generated to report an error that occurred during a request to the RSS Box Viewer.",
  image: "",
  items: [
    {
      title: "Oops, something went wrong…",
      description:
        "An error occurred while processing the request to the RSS Box Viewer."
    },
    {
      title: "The following error message was returned:",
      description: "Unknown error"
    },
    { title: "" }
  ]
};

// The descriptions are rendered as HTML, so anything coming from outside
// (the feed URL is taken from the query string) must not be inserted as is
const escapeHtml = text =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function (url, message) {
  // Copy the items, too: every box needs its own error message
  const error = {
    ...defaultError,
    items: defaultError.items.map(item => ({ ...item }))
  };
  const encodedUrl = encodeURIComponent(url);
  error.link = `${urls.app}?url=${encodedUrl}`;
  error.items[1].description = escapeHtml(message);
  error.items[2].description = `
    Most likely, this might have happened because of a non-existent or invalid RSS feed URL.
    <a href="https://validator.w3.org/feed/check.cgi?url=${encodedUrl}">Please check</a> and
    possibly correct your input, then try again.
  `;
  return error;
}
