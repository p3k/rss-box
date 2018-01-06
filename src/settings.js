import { URLS as LOCAL_URLS } from './local';

export const defaults = {
  boxFillColor: '#fff',
  compact: false,
  fontFace: '10pt sans-serif',
  frameColor: '#000',
  headless: false,
  height: -1,
  linkColor: '',
  maxItems: 7,
  radius: 0,
  showXmlButton: true,
  textColor: '#000',
  titleBarColor: '#add8e6',
  titleBarTextColor: '#000',
  url: 'https://blog.p3k.org/stories.xml',
  width: 200
};

export const KEYS = [
  'align',
  'boxFillColor',
  'compact',
  'fontFace',
  'frameColor',
  'headless',
  'height',
  'linkColor',
  'maxItems',
  'radius',
  'showXmlButton',
  'textColor',
  'titleBarColor',
  'titleBarTextColor',
  'url',
  'width'
];

export const URLS = Object.assign(
  {
    base: '//p3k.org/rss',
    roxy: location.protocol + '//p3k-services.appspot.com/roxy',
    ferris: location.protocol + '//p3k-services.appspot.com/ferris?group=rssbox'
  },
  LOCAL_URLS
);