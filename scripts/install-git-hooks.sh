#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"
chmod +x scripts/git-auto-sync.sh .githooks/post-commit
git config core.hooksPath .githooks

printf 'Git hooks installed. post-commit will now run auto-sync.\n'
