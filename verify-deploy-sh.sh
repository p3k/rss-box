#!/bin/sh

# Confirms the deploy.sh actually running on the server matches this
# repo’s copy, so a stale server-side copy cannot silently keep running
# old deploy/deploy-services logic instead of failing loudly. Shared by
# CI (staging.yml, deploy.yml) and manual deploys (npm run
# deploy:services) rather than duplicated in each.

expected=$(sha256sum deploy.sh | cut -d ' ' -f 1)
# A too-old server has no `version` case at all, so this call itself
# can fail – || true keeps that from tripping bash’s -e (in CI) before
# the comparison below gets to print the real reason
actual=$(ssh rss-box version || true)

if test "$actual" != "$expected"; then
  echo "deploy.sh on the server (sha256 $actual) does not match this repo’s copy ($expected)." >&2
  echo "On the server, run:" >&2
  echo "  curl -sO https://raw.githubusercontent.com/p3k/rss-box/main/deploy.sh && chmod +x deploy.sh" >&2
  exit 1
fi
