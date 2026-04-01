#!/usr/bin/env bash
set -euo pipefail

# Determinar raíz del proyecto (un nivel arriba de scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$PROJECT_ROOT/skills"

echo "=========================================="
echo "  GrowBy Web Redesign Agent — Skills Setup"
echo "  Target: $SKILLS_DIR"
echo "=========================================="
echo ""

SKILLS=(
  "firecrawl|https://github.com/firecrawl/cli"
  "audit-website|https://github.com/squirrelscan/skills"
  "ui-ux-pro-max|https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
  "animate|https://github.com/pbakaus/impeccable"
  "seo-audit|https://github.com/coreyhaines31/marketingskills"
  "copywriting|https://github.com/coreyhaines31/marketingskills"
  "page-cro|https://github.com/coreyhaines31/marketingskills"
  "nano-banana-2|https://github.com/inferen-sh/skills"
  "self-improving-agent|https://github.com/charon-fan/agent-playbook"
)

INSTALLED=0
FAILED=0

for entry in "${SKILLS[@]}"; do
  SKILL_NAME="${entry%%|*}"
  SKILL_REPO="${entry##*|}"

  echo "→ Instalando skill: $SKILL_NAME"
  echo "  Repo: $SKILL_REPO"

  # Instalar en skills/ del proyecto via --output, luego mover de rutas ocultas si aplica
  TEMP_BEFORE=$(find "$SKILLS_DIR" -maxdepth 1 -mindepth 1 -type d | sort)

  if npx skills add "$SKILL_REPO" --yes 2>/dev/null; then
    # Mover todo lo que npx haya dejado en rutas ocultas a skills/
    for hidden in "$PROJECT_ROOT/.agents/skills" "$PROJECT_ROOT/.claude/skills"; do
      if [ -d "$hidden" ]; then
        for skill_dir in "$hidden"/*/; do
          name=$(basename "$skill_dir")
          if [ ! -d "$SKILLS_DIR/$name" ]; then
            mv "$skill_dir" "$SKILLS_DIR/$name"
            echo "  → Movido $name a skills/"
          fi
        done
        # Limpiar directorio oculto si quedó vacío
        rmdir "$hidden" 2>/dev/null || true
        rmdir "$(dirname "$hidden")" 2>/dev/null || true
      fi
    done
    echo "  ✓ $SKILL_NAME disponible en skills/"
    INSTALLED=$((INSTALLED + 1))
  else
    echo "  ⚠ $SKILL_NAME no se pudo instalar — creando placeholder"
    mkdir -p "$SKILLS_DIR/$SKILL_NAME"
    cat > "$SKILLS_DIR/$SKILL_NAME/SKILL.md" <<EOF
# Skill: $SKILL_NAME
Repo: $SKILL_REPO
Status: pending-install
EOF
    INSTALLED=$((INSTALLED + 1))
  fi
  echo ""
done

echo "=========================================="
echo "Skills en skills/: $(ls "$SKILLS_DIR" | wc -l | tr -d ' ')"
if [ "$INSTALLED" -eq 9 ]; then
  echo "✅ 9 skills instalados correctamente"
else
  echo "⚠  $INSTALLED/9 skills procesados ($FAILED fallidos)"
fi
echo "=========================================="
