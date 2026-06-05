#!/usr/bin/env bash
# Deprecated: use Docker instead.
#   ./scripts/run-docker.sh
# See docs/DOCKER.md

exec "$(dirname "$0")/run-docker.sh" "$@"
