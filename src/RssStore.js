import { Store } from 'svelte/store';
import { RssParser } from './RssParser';
import { URLS, defaults } from './settings';
import error from './error';

export default class RssStore extends Store {
  constructor() {
    const settings = Object.assign(
      {
        date: new Date(),
        description: '',
        format: '',
        image: '',
        input: '',
        items: [],
        title: '',
        version: ''
      },
      defaults
    );

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

    this.observe('url', this.fetch);
  }

  fetch() {
    const url = this.get('url');
    if (!url) return;

    fetch(URLS.roxy + '?url=' + encodeURIComponent(url))
      .then(res => {
        if (!res.ok) throw Error(res);

        res
          .text()
          .then(json => {
            const parser = RssParser();
            const xml = JSON.parse(json).content;
            const data = parser.parse(xml);
            this.set(data);
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
