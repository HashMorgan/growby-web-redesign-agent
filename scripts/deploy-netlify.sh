#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Uso: bash scripts/deploy-netlify.sh <path-output>"
  echo "Ejemplo: bash scripts/deploy-netlify.sh outputs/growby-tech-2026-04-01/"
  exit 1
fi

OUTPUT_PATH="${1%/}"

if [ ! -d "$OUTPUT_PATH" ]; then
  echo "❌ Error: directorio no encontrado: $OUTPUT_PATH"
  exit 1
fi

# The assembler.js already produces a complete HTML file — use it directly.
HTML_FILE="${OUTPUT_PATH}/index.html"
if [ ! -f "$HTML_FILE" ]; then
  echo "❌ Error: index.html no encontrado en $OUTPUT_PATH"
  echo "   Ejecuta primero el pipeline: node scripts/orchestrator.js <URL>"
  exit 1
fi

# Verify it's real HTML (not JSX)
if grep -q "text/babel\|ReactDOM\|import React" "$HTML_FILE" 2>/dev/null; then
  echo "⚠ index.html parece contener JSX/React — verificar pipeline"
fi

CLIENT_NAME=$(basename "$OUTPUT_PATH" | sed 's/-[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$//')
SITE_NAME="growby-${CLIENT_NAME}"

echo "=========================================="
echo "  Deploy Netlify — GrowBy Agent v0.9.1"
echo "  Cliente:   $CLIENT_NAME"
echo "  Site name: $SITE_NAME"
echo "  HTML:      $HTML_FILE ($(wc -c < "$HTML_FILE") bytes)"
echo "=========================================="
echo ""

# Verificar netlify CLI
if ! command -v netlify &>/dev/null; then
  echo "⚠ netlify-cli no encontrado. Instalando..."
  npm install -g netlify-cli 2>&1 | tail -3
fi

# Cargar NETLIFY_AUTH_TOKEN desde .env si no está en entorno
if [ -z "${NETLIFY_AUTH_TOKEN:-}" ]; then
  ENV_FILE="$(dirname "$0")/../.env"
  if [ -f "$ENV_FILE" ]; then
    TOKEN=$(grep 'NETLIFY_AUTH_TOKEN' "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
    if [ -n "$TOKEN" ]; then
      export NETLIFY_AUTH_TOKEN="$TOKEN"
    fi
  fi
fi

if [ -z "${NETLIFY_AUTH_TOKEN:-}" ] && ! NETLIFY_AUTH_TOKEN="" netlify status 2>/dev/null | grep -q "Logged in"; then
  echo "  ⚠ No estás autenticado en Netlify."
  echo "  Configura NETLIFY_AUTH_TOKEN en .env o ejecuta: netlify login"
  echo "  ✓ HTML listo en: $HTML_FILE"
  exit 0
fi

echo "  ✓ Netlify autenticado"
echo ""
echo "→ Desplegando directorio a Netlify..."

DEPLOY_OUTPUT=$(NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-}" netlify deploy \
  --dir="$OUTPUT_PATH" \
  --prod \
  --site-name="$SITE_NAME" \
  --message="GrowBy Redesign — ${CLIENT_NAME} — $(date +%Y-%m-%d)" \
  2>&1)

echo "$DEPLOY_OUTPUT"

# Extraer URL del output
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-z0-9-]+\.netlify\.app' | tail -1)

if [ -n "$DEPLOY_URL" ]; then
  echo "$DEPLOY_URL" > "$OUTPUT_PATH/deploy-url.txt"
  echo ""
  echo "=========================================="
  echo "🌐 Demo lista: $DEPLOY_URL"
  echo "📋 URL guardada en $OUTPUT_PATH/deploy-url.txt"
  echo "=========================================="
else
  echo ""
  echo "⚠ No se pudo extraer la URL del deploy. Revisa el output arriba."
  echo "  HTML local listo en: $OUTPUT_PATH/index.html"
fi
