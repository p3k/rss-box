import { URLS } from './settings';

const defaultError = {
  loading: false,
  compact: false,
  headless: false,
  maxItems: 3,
  height: -1,
  version: 'Error',
  link: URLS.base,
  title: 'RSS Box Error',
  description:
    'This output was automatically generated to report an error that occurred during a request to the  RSS Box Viewer.',
  items: [
    {
      title: 'Oops, something went wrong…',
      description: 'An error occurred while processing the request to the RSS Box Viewer.'
    },
    {
      title: 'The following error message was returned:',
      description: 'Unknown error'
    },
    { title: '' }
  ]
};

export default function(url, message) {
  const error = Object.assign({}, defaultError);
  error.items[1].description = message;
  error.items[2].description = `Most likely, this might have happened because of a non-existent or invalid RSS feed URL. <a href="https://validator.w3.org/feed/check.cgi?url=${url}">Please check</a> and possibly correct your input, then try again.`;
  return error;
}
