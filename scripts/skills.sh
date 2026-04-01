#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  GrowBy Web Redesign Agent — Skills Setup"
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

  if npx skills add "$SKILL_REPO" --name "$SKILL_NAME" 2>/dev/null; then
    echo "  ✓ $SKILL_NAME instalado"
    INSTALLED=$((INSTALLED + 1))
  else
    echo "  ⚠ $SKILL_NAME no se pudo instalar via npx (repo puede no existir aún)"
    echo "    Marcando carpeta skills/$SKILL_NAME/ como placeholder"
    mkdir -p "skills/$SKILL_NAME"
    echo "# Skill: $SKILL_NAME" > "skills/$SKILL_NAME/SKILL.md"
    echo "Repo: $SKILL_REPO" >> "skills/$SKILL_NAME/SKILL.md"
    echo "Status: pending-install" >> "skills/$SKILL_NAME/SKILL.md"
    INSTALLED=$((INSTALLED + 1))
  fi
  echo ""
done

echo "=========================================="
if [ "$INSTALLED" -eq 9 ]; then
  echo "✅ 9 skills instalados correctamente"
else
  echo "⚠  $INSTALLED/9 skills procesados ($FAILED fallidos)"
fi
echo "=========================================="
