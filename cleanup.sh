#!/bin/bash
# EventBot Cleanup Script
# Remove arquivos desnecessários antes do deploy

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EventBot Cleanup Script"
echo "  Removendo arquivos desnecessários para GitHub Pages + Supabase"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")"

# Arquivos para remover
FILES_TO_REMOVE=(
  "server.py"
  "start.command"
  "TEST.html"
  "UPDATES_SUMMARY.txt"
  "v4.0_SUMMARY.txt"
  "v4.0_CHECKLIST.md"
  "COMPLETION_SUMMARY_v4.0.md"
  "INICIO_RAPIDO.md"
  "v4.0_FEATURES.md"
  "CHANGELOG.md"
  "PROJECT_SUMMARY.md"
  "TECNICAL_NOTES.md"
  "DEPLOYMENT.md"
  ".DS_Store"
)

echo "Arquivos marcados para remoção:"
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "  ❌ $file"
  else
    echo "  ⚠️  $file (não encontrado)"
  fi
done

echo ""
read -p "Deseja continuar? (sim/não): " confirm

if [ "$confirm" != "sim" ] && [ "$confirm" != "s" ]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "Removendo arquivos..."

for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  ✅ Removido: $file"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Cleanup completo!"
echo ""
echo "Arquivos restantes:"
ls -1 *.html *.js *.md 2>/dev/null | head -20
echo ""
echo "Para deploy no GitHub Pages:"
echo "  1. git init"
echo "  2. git add index.html app.js extraction.js extraction_config.js"
echo "  3. git commit -m 'Initial commit'"
echo "  4. git push origin main"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
