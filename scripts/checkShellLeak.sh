#!/usr/bin/env bash
set -euo pipefail

# rg が無い環境でも dev を止めない（Windows + bash でよくある）
RG_BIN="$(command -v rg 2>/dev/null || command -v rg.exe 2>/dev/null || true)"
if [[ -z "${RG_BIN}" ]]; then
  echo "[checkShellLeak] rg not found (rg/rg.exe). skipping."
  exit 0
fi

# “ターミナル貼り付け事故”っぽい行を検出したいだけ
# 対象外: node_modules/.next/.git 等
PATTERN='^(PS [A-Z]:\\|[a-zA-Z0-9._-]+@[A-Za-z0-9._-]+:|bash: |wsl: command not found|npm error|SyntaxError:|TypeError: Invalid URL)'

# ヒットしたら落とす
if "${RG_BIN}" -n --hidden --no-ignore-vcs \
  --glob '!.git/**' \
  --glob '!.next/**' \
  --glob '!node_modules/**' \
  --glob '!**/*.png' \
  --glob '!**/*.jpg' \
  --glob '!**/*.jpeg' \
  --glob '!**/*.webp' \
  -S "${PATTERN}" .; then
  echo ""
  echo "[checkShellLeak] ❌ shell output looks leaked into repo. Fix and retry."
  exit 1
fi

echo "[checkShellLeak] ✅ ok"
