#!/bin/bash
# SessionStart hook for Claude Code on the web: project dependencies + REA
# (reverse-engineering MCP server, https://github.com/morluto/rea).
set -euo pipefail

# Only in remote (web) sessions; local machines manage their own setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Project dependencies (tests, lint, build), exactly as locked. Skipped when
# the cached container already has them, and never rewrites package-lock.json.
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund
fi

# REA command line tool, installed once per container.
if ! command -v rea >/dev/null 2>&1; then
  npm install --global --no-audit --no-fund rea-agents
fi

# Register REA as an MCP server for Claude Code, unless already there.
if ! claude mcp get rea >/dev/null 2>&1; then
  claude mcp add --scope user rea -- rea mcp
fi
