#!/usr/bin/env bash
set -euo pipefail

if rg -n -S --glob 'app/**/*.{ts,tsx,js,jsx}' \
"^(cd\\s|cat\\s+>|cat\\s+<<|rm\\s+-rf\\s+\\.next|npm\\s+run\\s+dev|set\\s+-a|source\\s+\\.env|npx\\s+prisma|psql\\s|happy@|\\$\\s)|<<'EOF'|^\\s*#" app; then
  echo ""
  echo "ERROR: shell command leakage detected under app/. Fix before running dev."
  exit 1
fi
