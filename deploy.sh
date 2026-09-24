#!/bin/sh

# Use this script as forced command of an authorized SSH key:
# command="/path/to/deploy.sh",restrict ssh-ed25519 AAAAC3NzaC…
#
# Needs a passwordless sudo rule scoped to exactly the one command it needs
# to reload Apache, e.g. in /etc/sudoers.d/rss-box-deploy:
# rss-box ALL=(root) NOPASSWD: /usr/bin/systemctl reload apache2
#
# This copy is the source of truth, but nothing syncs it to the server
# automatically — the SSH key the deploy workflow uses is deliberately
# restricted to running this script, not overwriting it. After a change
# here, copy it to the server by hand. CI checks the server's copy
# against this one (the `version` case below) before every deploy that
# depends on it, so a forgotten copy fails loudly instead of silently
# running stale logic.

# How many timestamped backups `deploy`/`deploy-services` keep before
# pruning older ones
KEEP_BACKUPS=5

# Puts $2 in place as $HOME/$1. Renaming within the same filesystem is close
# to instantaneous, unlike a recursive delete or copy, so this keeps the
# window without that directory in place as short as possible.
replace_dir() {
  if test -d "$HOME/$1"; then
    mv "$HOME/$1" "$HOME/$1.previous"
  fi
  mv "$2" "$HOME/$1"
  rm -rf "$HOME/$1.previous"
}

# Creates a timestamped backup of $HOME/$1, if it currently exists
backup_dir() {
  if test -d "$HOME/$1"; then
    date=$(date +'%Y-%m-%d.%s%4N')
    echo "Create backup $HOME/$1-$date…"
    cp -Rp "$HOME/$1" "$HOME/$1-$date"
  fi
}

# Removes backups of $HOME/$1 beyond the newest $KEEP_BACKUPS
prune_backups() {
  find "$HOME" -maxdepth 1 -type d -name "$1-*.*" | sort | head -n -"$KEEP_BACKUPS" | while IFS= read -r old; do
    rm -rf "$old"
  done
}

# Restores $HOME/$1 from its latest backup, if any
revert_dir() {
  backup="$(find "$HOME" -maxdepth 1 -type d -name "$1-*.*" 2>/dev/null | sort | tail -1)"
  if test -z "$backup"; then
    echo 'No backup available.'
    return 1
  fi
  echo "Revert to latest backup $backup…"
  replace_dir "$1" "$backup"
}

case "$SSH_ORIGINAL_COMMAND" in
  ping)
    echo pong
    ;;

  # Lets a caller check whether the copy of this script running on the
  # server actually matches what it expects — nothing keeps them in sync
  # automatically (see the note at the top), and a stale copy here can
  # silently miss fixes to deploy/deploy-services/revert-services
  version)
    sha256sum "$0" | cut -d ' ' -f 1
    ;;

  # Reports which commit of the services submodule is actually live,
  # read from a marker file deploy-services leaves behind — lets CI
  # compare against what's really deployed instead of against the
  # previous push, which stays blind to a deploy that failed partway
  services-version)
    cat "$HOME"/services/.rss-box-services-revision 2>/dev/null || true
    ;;

  deploy)
    backup_dir production
    echo 'Copy files from stage to production…'
    cp -Rp "$HOME"/staging "$HOME"/production.update
    echo 'Patch configuration…'
    find "$HOME"/production.update -type f -print0 | xargs -0 sed -i 's|/rss-staging|/rss|g'
    replace_dir production "$HOME"/production.update
    prune_backups production
    echo 'Done.'
    ;;

  revert)
    revert_dir production || exit
    echo 'Done.'
    ;;

  deploy-services)
    # rrsync confines the client to $HOME/services.update, but it applies
    # the client's own destination argument (services-update/, matched
    # below) relative to that root rather than discarding it — so the
    # actual content lands one level deeper than the restricted root
    new_services="$HOME"/services.update/services-update
    backup_dir services
    echo 'Installing dependencies…'
    (cd "$new_services" && make install) || exit 1
    if test -d "$HOME"/services/.entrecote; then
      # .entrecote is the live referrer database; it is never part of a
      # deploy and must survive the swap below, not get discarded along
      # with the rest of the old services directory. Carried over before
      # the permission sweep below, not after, so it actually gets swept
      # too instead of silently keeping whatever it had before.
      echo 'Carrying over the referrer database…'
      # make install's own .entrecote target already created a fresh,
      # empty one here, since it's excluded from rsync — mv treats an
      # existing directory as somewhere to move INTO, not something to
      # replace, so that empty one has to go first or the real data
      # ends up nested one level too deep (.entrecote/.entrecote) and
      # invisible to the app instead of taking its place
      rmdir "$new_services"/.entrecote 2>/dev/null || true
      mv "$HOME"/services/.entrecote "$new_services"/.entrecote
    fi
    # Freshly rsynced content, and the venv make install just created,
    # comes out owned by this account's own default group — the live
    # app runs as www-data and needs at least read+traverse access to
    # actually import any of this once it's swapped in below. mv (in
    # replace_dir) never touches ownership, so this has to happen now,
    # before the swap, not once as a one-off fix after the fact.
    chgrp -R www-data "$new_services"
    find "$new_services" -type d -exec chmod g+rx {} +
    find "$new_services" -type f -exec chmod g+r {} +
    # .entrecote is the one path the live app actually writes to at
    # runtime — the referrer database itself, and the lock file PupDB
    # creates to guard concurrent access to it — so unlike the rest of
    # services, which is only ever read, it specifically needs group
    # write too.
    chmod g+w "$new_services"/.entrecote
    find "$new_services"/.entrecote -type f -exec chmod g+w {} +
    echo 'Swapping in the new services…'
    replace_dir services "$new_services"
    echo 'Reloading Apache…'
    # A plain reload only reloads Apache's own config — it does not by
    # itself make mod_wsgi re-import the application. mod_wsgi's daemon
    # mode watches the WSGI script's mtime and does a graceful worker
    # restart when it changes, which is the actual "pick up the new
    # code" signal; confirmed the reload alone was not enough by seeing
    # stale behavior survive several real deploys against production.
    touch "$HOME"/services/wsgi.py
    sudo systemctl reload apache2
    prune_backups services
    echo 'Done.'
    ;;

  revert-services)
    backup="$(find "$HOME" -maxdepth 1 -type d -name 'services-*.*' 2>/dev/null | sort | tail -1)"
    if test -z "$backup"; then
      echo 'No backup available.'
      exit 1
    fi
    if test -d "$HOME"/services/.entrecote; then
      # Keep the current, live referrer database rather than the stale
      # snapshot the backup happens to carry
      echo 'Carrying over the referrer database…'
      rm -rf "$backup"/.entrecote
      mv "$HOME"/services/.entrecote "$backup"/.entrecote
    fi
    echo "Revert to latest backup $backup…"
    replace_dir services "$backup"
    echo 'Reloading Apache…'
    touch "$HOME"/services/wsgi.py
    sudo systemctl reload apache2
    echo 'Done.'
    ;;

  *)
    # Allow any rsync command, restricted to one of two directories
    # depending on which one the client asked for
    case "$SSH_ORIGINAL_COMMAND" in
      *services-update*)
        rrsync -wo "$HOME"/services.update
        ;;
      *)
        rrsync -wo "$HOME"/staging
        ;;
    esac
    ;;
esac
