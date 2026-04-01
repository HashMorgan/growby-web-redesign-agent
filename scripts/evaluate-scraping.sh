#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Uso: bash scripts/evaluate-scraping.sh <URL>"
  echo "Ejemplo: bash scripts/evaluate-scraping.sh https://growby.tech"
  exit 1
fi

URL="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_DIR="/tmp/scraping-eval/$TIMESTAMP"
mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "  Evaluador de Scraping — GrowBy Agent"
echo "  URL: $URL"
echo "  Output: $OUTPUT_DIR"
echo "=========================================="
echo ""

# --- MÉTODO 1: Firecrawl ---
echo "→ Método 1: Firecrawl"
START_FC=$(date +%s%N)

if command -v firecrawl &>/dev/null; then
  firecrawl scrape "$URL" --output "$OUTPUT_DIR/firecrawl-output.json" 2>/dev/null && \
    echo "  ✓ Output: $OUTPUT_DIR/firecrawl-output.json" || \
    echo "  ⚠ Firecrawl no disponible o falló"
elif [ -n "${FIRECRAWL_API_KEY:-}" ]; then
  curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
    -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$URL\", \"formats\": [\"markdown\", \"html\"]}" \
    -o "$OUTPUT_DIR/firecrawl-output.json"
  echo "  ✓ Output: $OUTPUT_DIR/firecrawl-output.json"
else
  echo "  ⚠ FIRECRAWL_API_KEY no configurada — omitiendo Firecrawl"
  echo "{\"error\": \"FIRECRAWL_API_KEY not set\"}" > "$OUTPUT_DIR/firecrawl-output.json"
fi

END_FC=$(date +%s%N)
TIME_FC=$(( (END_FC - START_FC) / 1000000 ))
echo "  Tiempo Firecrawl: ${TIME_FC}ms"
echo ""

# --- MÉTODO 2: curl/wget ---
echo "→ Método 2: curl + wget"
START_CW=$(date +%s%N)

# curl — HTML completo
curl -sL \
  -A "Mozilla/5.0 (compatible; GrowByBot/1.0)" \
  --max-time 30 \
  "$URL" -o "$OUTPUT_DIR/curl-output.html" 2>/dev/null && \
  echo "  ✓ curl HTML: $OUTPUT_DIR/curl-output.html" || \
  echo "  ⚠ curl falló"

# curl — headers
curl -sI "$URL" -o "$OUTPUT_DIR/curl-headers.txt" 2>/dev/null && \
  echo "  ✓ curl headers: $OUTPUT_DIR/curl-headers.txt"

# wget — mirror ligero
if command -v wget &>/dev/null; then
  wget -qO "$OUTPUT_DIR/wget-output.html" "$URL" 2>/dev/null && \
    echo "  ✓ wget HTML: $OUTPUT_DIR/wget-output.html" || \
    echo "  ⚠ wget falló"
else
  echo "  ⚠ wget no disponible"
fi

END_CW=$(date +%s%N)
TIME_CW=$(( (END_CW - START_CW) / 1000000 ))
echo "  Tiempo curl/wget: ${TIME_CW}ms"
echo ""

# --- RESUMEN ---
echo "=========================================="
echo "  RESUMEN"
echo "  URL analizada: $URL"
echo "  Firecrawl:     ${TIME_FC}ms"
echo "  curl/wget:     ${TIME_CW}ms"
echo ""
echo "  Archivos en: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"
echo "=========================================="
