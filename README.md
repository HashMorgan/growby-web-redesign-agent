# GrowBy Web Redesign Agent

![Status](https://img.shields.io/badge/status-In%20Development-yellow)
![Version](https://img.shields.io/badge/version-v0.1.0-blue)
![Stack](https://img.shields.io/badge/stack-Claude%20Code%20%2B%20React%20%2B%20Tailwind-purple)

Agente de IA especializado en rediseño web automático. Recibe la URL del home de un prospecto y genera, en una sola sesión, un rediseño completo de UI + UX + SEO + Visual como artifact React compartible — listo para presentar al cliente o entregar al equipo de desarrollo.

---

## Arquitectura de 5 fases

```
FASE 1 — SCRAPING
  Firecrawl (HTML limpio + markdown) + audit-website (score + 230 reglas)
  → memory/working/scraping-[timestamp].json

FASE 2 — ANÁLISIS (4 subagentes paralelos)
  UI Agent      → design system por industria (ui-ux-pro-max)
  UX Agent      → conversión + animaciones (page-cro + animate)
  SEO/Copy Agent → checklist técnico + copy reescrito (seo-audit + copywriting)
  Visual Agent  → prompts Gemini API por industria detectada
  → memory/working/analysis-[timestamp].json

FASE 3 — GENERACIÓN
  Artifact React self-contained con Tailwind CDN, copy SEO, animaciones e imágenes Gemini
  → outputs/[cliente]-[fecha]/redesign.jsx

FASE 4 — OUTPUT DUAL
  Demo URL en Claude.ai + ZIP para dev (scripts/export-for-dev.sh)

FASE 5 — MEMORIA
  Feedback loop → actualiza semantic-patterns.json + episodic memory
  → memory/episodic/[cliente]-[fecha].json
```

---

## Setup rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/HashMorgan/growby-web-redesign-agent.git
cd growby-web-redesign-agent

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys (Gemini + Firecrawl)

# 3. Instalar los 9 skills
bash scripts/skills.sh
```

---

## Uso

Desde Claude Code, escribe:

```
Ejecuta el Web Redesign Agent sobre: https://url-del-prospecto.com
```

El agente confirmará la URL y pedirá autorización antes de iniciar requests externos. Al finalizar entrega:
- Artifact React renderizable directamente en Claude.ai
- ZIP con redesign.jsx + analysis.json listo para el dev

---

## Skills requeridos

| Skill | Propósito | Repo |
|-------|-----------|------|
| `firecrawl` | Scraping avanzado: HTML limpio, markdown, metadata | https://github.com/firecrawl/cli |
| `audit-website` | Score 0-100 + reporte de 230+ reglas web | https://github.com/squirrelscan/skills |
| `ui-ux-pro-max` | Design system por industria, tokens, componentes | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| `animate` | Estrategia de animaciones: hero, transitions, delight | https://github.com/pbakaus/impeccable |
| `seo-audit` | Checklist técnico SEO completo | https://github.com/coreyhaines31/marketingskills |
| `copywriting` | Reescritura de copy optimizado para conversión | https://github.com/coreyhaines31/marketingskills |
| `page-cro` | Análisis de 7 dimensiones de conversión (CRO) | https://github.com/coreyhaines31/marketingskills |
| `nano-banana-2` | Orquestación de prompts para generación de imágenes | https://github.com/inferen-sh/skills |
| `self-improving-agent` | Feedback loop y aprendizaje por industria | https://github.com/charon-fan/agent-playbook |

---

## Scripts de utilidad

```bash
# Comparar métodos de scraping sobre una URL
bash scripts/evaluate-scraping.sh https://url-del-prospecto.com

# Empaquetar output para entregar al dev
bash scripts/export-for-dev.sh outputs/cliente-2026-04-01/
```

---

*Desarrollado por GrowBy — [growby.tech](https://growby.tech)*
