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

JSX_FILE=$(find "$OUTPUT_PATH" -name "redesign.jsx" -maxdepth 1 | head -1)
if [ -z "$JSX_FILE" ]; then
  echo "❌ Error: redesign.jsx no encontrado en $OUTPUT_PATH"
  echo "   Ejecuta primero el generador: node scripts/generator.js"
  exit 1
fi

CLIENT_NAME=$(basename "$OUTPUT_PATH" | sed 's/-[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$//')
SITE_NAME="growby-${CLIENT_NAME}"
DEPLOY_DIR="/tmp/netlify-deploy-${CLIENT_NAME}-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

echo "=========================================="
echo "  Deploy Netlify — GrowBy Agent"
echo "  Cliente:   $CLIENT_NAME"
echo "  Site name: $SITE_NAME"
echo "  Deploy:    $DEPLOY_DIR"
echo "=========================================="
echo ""

echo "→ Convirtiendo redesign.jsx a index.html self-contained..."

JSX_CONTENT=$(cat "$JSX_FILE")

cat > "$DEPLOY_DIR/index.html" << HTMLEOF
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${CLIENT_NAME} — Redesign Preview by GrowBy</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #root { min-height: 100vh; }
    .loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.25rem; color: #6b7280; }
  </style>
</head>
<body>
  <div id="root"><div class="loading">Cargando redesign...</div></div>
  <script type="text/babel">
    // GrowBy Web Redesign Agent — Generated Preview
    // Cliente: ${CLIENT_NAME}
    // Generado por: GrowBy Web Redesign Agent v0.2.0

${JSX_CONTENT}

    // Mount the app
    const rootElement = document.getElementById('root');
    const root = ReactDOM.createRoot(rootElement);
    // Try to find and render the main component
    const ComponentName = typeof App !== 'undefined' ? App :
                          typeof Redesign !== 'undefined' ? Redesign :
                          typeof HomePage !== 'undefined' ? HomePage :
                          typeof LandingPage !== 'undefined' ? LandingPage : null;
    if (ComponentName) {
      root.render(React.createElement(ComponentName));
    } else {
      rootElement.innerHTML = '<div style="padding:2rem;color:#ef4444">⚠ No se encontró el componente principal (App/Redesign/HomePage). Verifica redesign.jsx.</div>';
    }
  </script>
</body>
</html>
HTMLEOF

echo "  ✓ index.html generado ($(wc -c < "$DEPLOY_DIR/index.html") bytes)"
echo ""

# Verificar netlify CLI
if ! command -v netlify &>/dev/null; then
  echo "⚠ netlify-cli no encontrado. Instalando..."
  npm install -g netlify-cli 2>&1 | tail -3
fi

# Verificar autenticación
echo "→ Verificando autenticación Netlify..."
if ! netlify status 2>/dev/null | grep -q "Logged in"; then
  echo "  ⚠ No estás autenticado en Netlify."
  echo "  Ejecuta: netlify login"
  echo "  Luego vuelve a correr este script."
  # Guardar el HTML generado de todas formas
  cp "$DEPLOY_DIR/index.html" "$OUTPUT_PATH/preview.html"
  echo ""
  echo "  ✓ preview.html guardado en $OUTPUT_PATH/preview.html"
  echo "  Puedes abrirlo localmente con: open $OUTPUT_PATH/preview.html"
  exit 0
fi

echo "  ✓ Netlify autenticado"
echo ""
echo "→ Desplegando a Netlify..."

DEPLOY_OUTPUT=$(netlify deploy \
  --dir="$DEPLOY_DIR" \
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
  # Fallback: guardar HTML local
  cp "$DEPLOY_DIR/index.html" "$OUTPUT_PATH/preview.html"
  echo "  preview.html local guardado en: $OUTPUT_PATH/preview.html"
fi

# Limpiar temp
rm -rf "$DEPLOY_DIR"
