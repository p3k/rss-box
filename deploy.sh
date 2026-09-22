#!/bin/sh

# Use this script as forced command of an authorized SSH key:
# command="/path/to/deploy.sh",restrict ssh-ed25519 AAAAC3NzaC…

# How many timestamped backups `deploy` keeps before pruning older ones
KEEP_BACKUPS=5

# Puts $1 in place as $HOME/production. Renaming within the same filesystem
# is close to instantaneous, unlike a recursive delete or copy, so this
# keeps the window without a production directory as short as possible.
replace_production() {
  if test -d "$HOME"/production; then
    mv "$HOME"/production "$HOME"/production.previous
  fi
  mv "$1" "$HOME"/production
  rm -rf "$HOME"/production.previous
}

case "$SSH_ORIGINAL_COMMAND" in
  ping)
    echo pong
    ;;

  deploy)
    if test -d "$HOME"/production; then
      date=$(date +'%Y-%m-%d.%s%4N')
      echo "Create backup $HOME/production-$date…"
      cp -Rp "$HOME"/production "$HOME"/production-"$date"
    fi
    echo 'Copy files from stage to production…'
    cp -Rp "$HOME"/staging "$HOME"/production.update
    echo 'Patch configuration…'
    find "$HOME"/production.update -type f -print0 | xargs -0 sed -i 's|/rss-staging|/rss|g'
    replace_production "$HOME"/production.update
    echo 'Prune old backups…'
    find "$HOME" -maxdepth 1 -type d -name 'production-*.*' | sort | head -n -"$KEEP_BACKUPS" | while IFS= read -r old; do
      rm -rf "$old"
    done
    echo 'Done.'
    ;;

  revert)
    backup="$(find "$HOME" -maxdepth 1 -type d -name 'production-*.*' 2>/dev/null | sort | tail -1)"
    if test -z "$backup"; then
      echo 'No backup available.'
      exit
    fi
    echo "Revert to latest backup $backup…"
    replace_production "$backup"
    echo 'Done.'
    ;;

  *)
    # Allow any rsync command but restrict it to the staging directory
    rrsync -wo /home/rss-box/staging
    ;;
esac
