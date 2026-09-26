# Installation of RSS Box Viewer

## Prerequisites

- Git
- Node.js
- Python 3 incl. header files
- Apache 2.4 incl. header files

## Clone Repository

```sh
git clone --recurse-submodules https://github.com/p3k/rss-box.git
cd rss-box
npm install
```

## Install Dependencies

```sh
# This installs both, server (Python) and client (Node.js) dependencies
npm install
```

> 💡 The script creates a virtual environment and installs the Python dependencies there.

## Run App in Development Mode

```sh
npm start
# In another terminal (alternatively, enter the URL in your browser, manually)
xdg-open http://localhost:8000
```

## Run Tests

The tests use Node’s built-in test runner and require the Node version given in `.nvmrc`.

```sh
nvm use
npm test
```

Some tests compare their results with “golden” files in `tests/fixtures/golden`. After an intended change of behavior, review and update them with:

```sh
UPDATE_GOLDEN=1 npm test
git diff tests/fixtures/golden
```

## Rebuild Production Files

```sh
npm run build
# The built files are located in the `dist` directory
```

## Customize URLs

`src/local.js` is created automatically (empty) by `npm install` if it doesn’t already exist, and is ignored by Git – it’s meant for your own personal overrides, e.g. pointing your local dev environment at a real backend instead of running `services/` locally. (`src/environment.js`, created the same way, is the equivalent CI uses to configure a deployed build – not something you’d normally touch by hand; see “Manual deploys” below.) Either one **replaces** `urls.js`'s corresponding entries wholesale rather than merging into them, so an override has to restate a full URL (including any query string) rather than just the part that differs:

```js
// src/local.js
export const urls = {
  // The base URL of the installation
  app: "https://host.domain.tld/rss-box-viewer",
  // The JSON proxy for retrieving feeds
  proxy: "https://host.domain.tld/json-services/roxy",
  // The referrer counter. `days` bounds how far back referrers are
  // shown; keep it in sync with referrerDays in src/urls.js
  referrers:
    "https://host.domain.tld/json-services/ferris?group=rss-box&days=30",
  // The feed to be displayed by default when opening the base URL
  feed: "https://host.domain.tld/default-feed.xml"
};
```

## Configure the Backend (Services)

The referrer counter and feed proxy (`services/`, the `p3k/json3k` submodule) run under Apache/mod_wsgi, entirely independently of this frontend. See [`services/README.md`](services/README.md) for its Apache/WSGI configuration.

## Deploying

This is the setup behind the `Deploy (Stage)`/`Deploy (Production)` GitHub Actions workflows and the `npm run deploy:*` scripts – most of it only matters if you’re standing up your own deployment target, not for local development.

### Forced-command SSH key

CI (and any manual deploy) reaches the server through one SSH key, restricted to running [`deploy.sh`](deploy.sh) and nothing else – it can’t run arbitrary commands, including rewriting `deploy.sh` itself. Add it to the deploy account’s `authorized_keys`:

```
command="/path/to/deploy.sh",restrict ssh-ed25519 AAAA... (public key content)
```

`deploy.sh`'s `deploy-services` case also needs a passwordless sudo rule to reload Apache, e.g. in `/etc/sudoers.d/rss-box-deploy`:

```
rss-box ALL=(root) NOPASSWD: /usr/bin/systemctl reload apache2
```

**Nothing syncs `deploy.sh` to the server automatically** – that’s deliberate, so a compromised CI credential can never rewrite the one script that limits what it’s allowed to do. After any change to it, copy it over by hand:

```sh
curl -sO https://raw.githubusercontent.com/p3k/rss-box/main/deploy.sh && chmod +x deploy.sh
```

CI checks the server’s copy against the repo’s before every deploy that depends on it (the `version` case in `deploy.sh`) and refuses to proceed – with that same command – if they don’t match, rather than silently running stale logic.

### GitHub Actions configuration

The `Deploy (Stage)` and `Deploy (Production)` workflows need, per environment (`stage`/`p3k.org`):

- `SSH_PRIVATE_KEY` (secret) – the private half of the forced-command key above
- `SSH_CONFIG` (var) – an `~/.ssh/config` snippet defining the `rss-box` host alias these workflows `ssh`/`rsync` against, e.g.:
  ```
  Host rss-box
    HostName your.server.tld
    User rss-box
  ```
- `SSH_KNOWN_HOSTS` (var) – that host’s known-hosts entry (`ssh-keyscan your.server.tld`)
- `BASE_URL` (var, stage only) – the origin the staging build’s URLs are generated against, e.g. `https://your.server.tld`

### Manual deploys

```sh
npm run deploy:staging   # builds and rsyncs dist/ to staging
npm run deploy:services  # rsyncs services/ and runs deploy-services on the server
```

Both use whatever `src/environment.js` currently contains, so for a manual deploy, temporarily replace it with the target environment’s real URLs (matching what `staging.yml`'s "Configure environment" step generates) before running either, and restore it to empty afterward – don’t deploy a build carrying stale environment URLs. `src/local.js` is untouched by this – leave your own overrides there as they are.

Production is promoted from whatever’s currently on staging, via the `Deploy (Production)` GitHub Actions workflow (`workflow_dispatch` – not triggered automatically by any push).
