var TARGET = 'production';

var BASE_URI = location.protocol + '//p3k.org/rss';
var ROXY_URI = location.protocol + '//p3k-services.appspot.com/roxy';
var FERRIS_URI = location.protocol + '//p3k-services.appspot.com/ferris?callback=?&group=rssbox';

switch (TARGET) {
  case 'mixed':
  BASE_URI = 'http://localhost:8000';
  break;

  case 'dev':
  BASE_URI = 'http://localhost:8000';
  ROXY_URI = 'http://localhost:8001/roxy';
  FERRIS_URI = 'http://localhost:8001/ferris?callback=?&group=rssbox';
  break;
}

module.exports = {
  baseUri: BASE_URI,
  roxyUri: ROXY_URI,
  ferrisUri: FERRIS_URI
};
