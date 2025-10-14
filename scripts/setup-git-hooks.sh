#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "Setting git hooks path to ${REPO_ROOT}/.githooks"
git config core.hooksPath ".githooks"

echo "Done. Pre-commit hooks will run on your next commit.
