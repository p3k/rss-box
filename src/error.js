import { urls } from "./urls";

const defaultError = {
  loading: false,
  compact: false,
  maxItems: 3,
  format: "Error",
  version: "❌",
  title: "RSS Box Error",
  description:
    "This output was automatically generated to report an error that occurred during a request to the RSS Box Viewer.",
  image: "",
  items: [
    {
      title: "Oops, something went wrong…",
      description: "An error occurred while processing the request to the RSS Box Viewer."
    },
    {
      title: "The following error message was returned:",
      description: "Unknown error"
    },
    { title: "" }
  ]
};

export default function(url, message) {
  const error = Object.assign({}, defaultError);
  error.link = urls.app + "?url=" + url;
  error.items[1].description = message;
  error.items[2].description = `
    Most likely, this might have happened because of a non-existent or invalid RSS feed URL.
    <a href="https://validator.w3.org/feed/check.cgi?url=${url}">Please check</a> and
    possibly correct your input, then try again.
  `;
  return error;
}
