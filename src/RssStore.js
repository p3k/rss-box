import { Store } from 'svelte/store';
import { RssParser } from './RssParser';
import { URLS, defaults } from './settings';
import error from './error';

export default class RssStore extends Store {
  constructor() {
    const settings = {
      date: new Date(),
      description: '',
      format: '',
      image: '',
      input: '',
      items: [],
      title: '',
      version: ''
    };

    super(settings);

    this.compute('formattedDate', ['date'], date => {
      if (!date) return;
      let month = (date.getMonth() + 1).toString().padStart(2, '0');
      let day = date
        .getDate()
        .toString()
        .padStart(2, '0');
      let hours = date
        .getHours()
        .toString()
        .padStart(2, '0');
      let minutes = date
        .getMinutes()
        .toString()
        .padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
    });

    this.observe('url', this.fetch, { init: false });
  }

  fetch() {
    const url = this.get('url');
    if (!url) return;

    this.set({ loading: true });

    fetch(URLS.roxy + '?url=' + encodeURIComponent(url))
      .then(res => {
        if (!res.ok) throw Error(res.statusText);

        res
          .text()
          .then(json => {
            const parser = RssParser();
            const data = JSON.parse(json);
            if (data.headers['X-Roxy-Status']) throw Error(data.headers['X-Roxy-Message']);
            const rss = parser.parse(data.content);
            if (!rss.date) rss.date = new Date(data.headers.date);
            rss.loading = false;
            this.set(rss);
          })
          .catch(message => {
            this.set(error(url, message));
          });
      })
      .catch(message => {
        this.set(error(url, message));
      });
  }
}
