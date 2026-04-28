#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_DIR="${ROOT_DIR}/.git/.auto-sync.lock"
MODE="${1:-once}"
INTERVAL_SECONDS="${AUTO_SYNC_INTERVAL_SECONDS:-60}"
COMMIT_MESSAGE="${AUTO_SYNC_COMMIT_MESSAGE:-chore(sync): auto checkpoint}"

log() {
  printf '[git-auto-sync] %s\n' "$*"
}

cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

ensure_ready() {
  cd "$ROOT_DIR"

  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    log "Skipping: not a git repository."
    return 1
  }

  git symbolic-ref --quiet HEAD >/dev/null 2>&1 || {
    log "Skipping: detached HEAD."
    return 1
  }

  git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1 || {
    log "Skipping: no upstream branch is configured."
    return 1
  }
}

has_worktree_changes() {
  ! git diff --quiet --no-ext-diff || \
    ! git diff --cached --quiet --no-ext-diff || \
    [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

commit_if_needed() {
  if ! has_worktree_changes; then
    return 0
  fi

  git add -A

  if git diff --cached --quiet --no-ext-diff; then
    return 0
  fi

  GIT_EDITOR=: git commit --no-verify -m "$COMMIT_MESSAGE" >/dev/null
  log "Created auto-sync commit."
}

sync_once() {
  ensure_ready || return 0

  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    log "Sync already running, skipping."
    return 0
  fi

  trap cleanup_lock RETURN

  commit_if_needed
  git pull --rebase --autostash --quiet
  git push --quiet
  log "Synced with remote."
}

case "$MODE" in
  once)
    sync_once
    ;;
  loop)
    while true; do
      sync_once || true
      sleep "$INTERVAL_SECONDS"
    done
    ;;
  *)
    printf 'Usage: %s [once|loop]\n' "$0" >&2
    exit 1
    ;;
esac
