#!/usr/bin/env bash

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

INPUT=$(cat)
FILE=$(node -e "
const d = JSON.parse(process.argv[1]);
const fp = d.tool_input && (d.tool_input.file_path || d.tool_input.path);
if (fp) process.stdout.write(fp);
" "$INPUT" 2>/dev/null)

[[ -z "$FILE" ]] && exit 0
[[ "$FILE" != "$PROJECT_DIR/"* ]] && exit 0
[[ ! -f "$FILE" ]] && exit 0

EXT="${FILE##*.}"

# Strip trailing whitespace from all text files
sed -i '' 's/[[:space:]]*$//' "$FILE" 2>/dev/null || true

case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs|json|css|md|mdx)
    npx --prefix "$PROJECT_DIR" prettier --write "$FILE" 2>&1 | sed 's/^/[prettier] /' >&2 || true
    ;;
  *)
    exit 0
    ;;
esac

case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs)
    npx --prefix "$PROJECT_DIR" eslint --fix "$FILE" 2>&1 | sed 's/^/[eslint] /' >&2 || true
    ;;
esac

exit 0
