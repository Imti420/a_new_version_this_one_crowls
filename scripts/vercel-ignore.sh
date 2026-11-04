#!/bin/sh
# Exit 0 skips the Vercel build. Exit 1 builds.
# Discovery logs must not rebuild the whole site. The page reads the newer
# copy from GitHub when this deploy is skipped.
if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  exit 1
fi
files=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" HEAD 2>/dev/null) || exit 1
if [ -z "$files" ]; then
  exit 1
fi
other=$(printf '%s\n' "$files" | grep -v -E '^(data/ops/|public/ops/)' || true)
if [ -n "$other" ]; then
  exit 1
fi
exit 0
