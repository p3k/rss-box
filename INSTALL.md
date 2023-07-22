# Installation of RSS Box Viewer

## Prerequisites

* Git
* NodeJS
* Python 3 incl. header files
* Apache 2.4 incl. header files

## Clone Repository

```sh
git clone https://github.com/p3k/rss-box.git
cd rss-box
```

## Create Virtual Environment

```sh
python3 -m venv /path/to/virtual-environment
source /path/to/virtual-environment/bin/activate
```

## Install Dependencies

```sh
# This installs both, server (Python) and client (NodeJS) dependencies
npm install
```

## Run App in Development Mode

```sh
npm start
# In another terminal (alternatively, enter the URL in your browser, manually)
xdg-open http://localhost:8000
```

## Rebuild Production Files

```sh
npm run build
# The built files are located in the `dist` directory
```

## Customize URLs

```js
// src/local.js
export const urls = {
  // The base URL of the installation
  app: 'https://host.domain.tld/rss-box-viewer',
  // The JSON proxy for retrieving feeds
  proxy: 'https://host.domain.tld/json-services/roxy',
  // The referrer counter
  referrers: 'https://host.domain.tld/json-services/ferris?group=rss-box',
  // The feed to be displayed by default when opening the base URL
  feed: 'https://host.domain.tld/default-feed.xml'
};
```

## Configure Apache Webserver

```apache
# Replace with actual path!
LoadModule wsgi_module "/path/to/virtual-environment/lib/python3…/site-packages/mod_wsgi/server/mod_wsgi-py3….so"

WSGIRestrictEmbedded On
WSGISocketPrefix /var/run/apache2/wsgi

WSGIDaemonProcess services python-home=/path/to/virtual-environment python-path=/path/to/rss-box/services

WSGIScriptAlias /services /path/to/rss-box/services/wsgi.py process-group=services

<Location /services>
   WSGIApplicationGroup %{GLOBAL}
   Require all granted
</Location>
```

Please refer to the [mod_wsgi User Guide](https://modwsgi.readthedocs.io/en/master/user-guides/virtual-environments.html) for details.
