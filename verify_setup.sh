#!/bin/bash
# Verification script for EventBot v5.0 setup

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EventBot v5.0 Setup Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"

# Check required files
REQUIRED_FILES=("index.html" "app.js" "extraction.js" "extraction_config.js" "README_V5.md" "IMPLEMENTATION_SUMMARY.md")

echo "Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
  fi
done

echo ""
echo "Checking extraction.js syntax..."
node -c extraction.js 2>&1
EXTRACTION_STATUS=$?
if [ $EXTRACTION_STATUS -eq 0 ]; then
  echo "  ✅ extraction.js: syntax OK"
else
  echo "  ❌ extraction.js: syntax ERROR"
fi

echo ""
echo "Checking app.js syntax..."
node -c app.js 2>&1
APP_STATUS=$?
if [ $APP_STATUS -eq 0 ]; then
  echo "  ✅ app.js: syntax OK"
else
  echo "  ❌ app.js: syntax ERROR"
fi

echo ""
echo "Checking for old extractFromLink function..."
OLD_FUNCS=$(grep -c "async function extractFromLink(" app.js || true)
if [ $OLD_FUNCS -gt 0 ]; then
  echo "  ❌ Found $OLD_FUNCS old extractFromLink functions"
else
  echo "  ✅ No old extractFromLink functions found"
fi

echo ""
echo "Checking for extractFromLinkEnhanced calls..."
NEW_CALLS=$(grep -c "extractFromLinkEnhanced(" app.js || true)
echo "  Found $NEW_CALLS calls to extractFromLinkEnhanced"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Files ready for GitHub Pages:"
echo "  - index.html"
echo "  - app.js"
echo "  - extraction.js"
echo "  - extraction_config.js"
echo ""
echo "Files to remove (run cleanup.sh):"
echo "  - server.py"
echo "  - start.command"
echo "  - TEST.html"
echo "  - *.txt (summary files)"
echo "  - v4.0_*.md (old documentation)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
