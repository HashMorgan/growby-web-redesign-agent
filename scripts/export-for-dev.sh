#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Uso: bash scripts/export-for-dev.sh <path-output>"
  echo "Ejemplo: bash scripts/export-for-dev.sh outputs/growby-2026-04-01/"
  exit 1
fi

OUTPUT_PATH="${1%/}"  # quita trailing slash si existe

if [ ! -d "$OUTPUT_PATH" ]; then
  echo "❌ Error: directorio no encontrado: $OUTPUT_PATH"
  exit 1
fi

# Verificar archivos requeridos
JSX_FILE=$(find "$OUTPUT_PATH" -name "redesign.jsx" -maxdepth 1 | head -1)
JSON_FILE=$(find "$OUTPUT_PATH" -name "analysis.json" -maxdepth 1 | head -1)

if [ -z "$JSX_FILE" ]; then
  echo "❌ Error: redesign.jsx no encontrado en $OUTPUT_PATH"
  exit 1
fi

if [ -z "$JSON_FILE" ]; then
  echo "⚠ Advertencia: analysis.json no encontrado — exportando solo redesign.jsx"
fi

# Nombre del cliente desde el path
CLIENT_NAME=$(basename "$OUTPUT_PATH" | sed 's/-[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$//')
DATE_STR=$(date +%Y-%m-%d)
ZIP_NAME="${CLIENT_NAME}-redesign-${DATE_STR}.zip"
ZIP_PATH="outputs/$ZIP_NAME"

echo "=========================================="
echo "  Export para Dev — GrowBy Agent"
echo "  Source: $OUTPUT_PATH"
echo "  Output: $ZIP_PATH"
echo "=========================================="
echo ""

# Crear temp dir para staging
TEMP_DIR=$(mktemp -d)
STAGE_DIR="$TEMP_DIR/${CLIENT_NAME}-redesign"
mkdir -p "$STAGE_DIR"

# Copiar archivos
cp "$JSX_FILE" "$STAGE_DIR/"
echo "  ✓ redesign.jsx copiado"

if [ -n "$JSON_FILE" ]; then
  cp "$JSON_FILE" "$STAGE_DIR/"
  echo "  ✓ analysis.json copiado"
fi

# Copiar nano-banana-prompts si existe
NANO_FILE=$(find "$OUTPUT_PATH" -name "nano-banana-prompts.json" -maxdepth 1 | head -1)
if [ -n "$NANO_FILE" ]; then
  cp "$NANO_FILE" "$STAGE_DIR/"
  echo "  ✓ nano-banana-prompts.json copiado"
fi

# Crear README de entrega
cat > "$STAGE_DIR/README-DEV.md" << EOF
# Redesign Package — $CLIENT_NAME
Generado: $DATE_STR por GrowBy Web Redesign Agent

## Archivos incluidos
- \`redesign.jsx\` — Componente React self-contained, usa Tailwind CDN
- \`analysis.json\` — Análisis completo (UI, UX, SEO, copy)
- \`nano-banana-prompts.json\` — Prompts de imágenes para Gemini API (si aplica)

## Setup rápido
\`\`\`bash
# El JSX es self-contained. Solo necesitas un entorno React.
# Tailwind está incluido via CDN en el componente.
# Para imágenes: configura GEMINI_API_KEY en tu .env
\`\`\`

## Desarrollado por
GrowBy — growby.tech
EOF
echo "  ✓ README-DEV.md generado"

# Comprimir
(cd "$TEMP_DIR" && zip -r - "${CLIENT_NAME}-redesign/") > "$ZIP_PATH"
echo ""
echo "  ✓ ZIP creado: $ZIP_PATH"
echo "  Tamaño: $(du -sh "$ZIP_PATH" | cut -f1)"

# Limpiar temp
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "✅ Export completado: $ZIP_PATH"
echo "=========================================="
