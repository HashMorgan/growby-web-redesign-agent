# GrowBy Web Redesign Agent

![Status](https://img.shields.io/badge/status-Production-green)
![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Stack](https://img.shields.io/badge/stack-Stitch%20MCP%20%2B%20Claude%20Code%20%2B%20React%20%2B%20Tailwind-purple)

Agente de IA especializado en rediseño web automático. Recibe la URL del home de un prospecto y genera, en una sola sesión, un rediseño completo de UI + UX + SEO + Visual como artifact React compartible — listo para presentar al cliente o entregar al equipo de desarrollo.

---

## Arquitectura v1.0.0 — Stitch MCP + Multi-Subagent Pipeline

```
FASE 1 — SCRAPING (deep multi-página)
  scraper-pro.js → Firecrawl crawl (hasta 15 páginas)
  Fallback: Firecrawl scrape (single) → fallback nativo
  → memory/working/scraping-deep-[timestamp].json

FASE 2 — ANÁLISIS (4 subagentes paralelos con token slicing)
  UI Agent      → design system por industria (ui-ux-pro-max)
  UX Agent      → 7 dimensiones CRO + quick wins (page-cro)
  SEO/Copy Agent → auditoría + copy reescrito (seo-audit + copywriting)
  Visual Agent  → prompts Gemini API optimizados por industria
  → outputs/[cliente]-[fecha]/analysis.json (70% menos tokens)

FASE 3 — LAYOUT PLANNING
  layout-architect.js → plan de secciones + design system
  → outputs/[cliente]-[fecha]/layout-plan.json

FASE 3.5 — STITCH AI GENERATION (con fallback)
  ✨ PRIMARIO: Stitch MCP (Google Gemini 3 Flash)
     brief-generator.js → prompt optimizado (max 500 chars)
     stitch-generator.js → generación con timeout 30s
     → outputs/[cliente]-[fecha]/stitch-output.html
  
  🔄 FALLBACK: Component-Builder Pipeline
     component-builder.js → componentes template-based
     assembler.js → HTML final con anti-contamination check
     → outputs/[cliente]-[fecha]/index.html

FASE 6 — DEPLOY A NETLIFY
  deploy-netlify.sh → publica automáticamente
  → URL pública compartible

MEMORIA — Feedback loop continuo
  → memory/episodic/[cliente]-[fecha].json
  → memory/semantic-patterns.json (aprendizaje por industria)
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

## Seguridad

El sistema incluye autenticación y hardening de seguridad para uso interno:

### Medidas implementadas

| Capa | Implementación |
|------|----------------|
| **Autenticación** | bcrypt (12 rounds) + sesiones SQLite |
| **Headers** | Helmet (CSP, X-Frame-Options, HSTS) |
| **Rate limiting** | 5 intentos login/15min, 100 req/15min global |
| **Anti-timing** | Delay 1s en login fallido |
| **SQL Injection** | Consultas parametrizadas |
| **CSRF** | Cookies SameSite strict |
| **XSS** | Content Security Policy + sanitización |

### Cambiar contraseña

```bash
node scripts/change-password.js
```

CLI interactivo que:
- Verifica contraseña actual
- Solicita nueva contraseña (mín. 8 chars)
- Hashea con bcrypt rounds 12
- Invalida todas las sesiones activas

### Tests de seguridad

Ejecutar antes de cada deploy:

```bash
node scripts/security-tests.js
```

Suite de 8 tests automáticos. Si alguno falla → exit code 1.

### ⚠️ Advertencia

**Uso interno exclusivo — NO exponer sin SSL/TLS.**

Esta aplicación contiene:
- Credenciales de acceso a APIs externas
- Datos de clientes en memoria episódica
- Sesiones de rediseño en tiempo real

Antes de exponer públicamente:
1. Configurar SSL con Certbot
2. Cambiar `SESSION_SECRET` en `.env`
3. Habilitar `secure: true` en cookies (requiere HTTPS)
4. Configurar firewall (solo 22, 80, 443)
5. Revisar logs de acceso periódicamente

---

*Desarrollado por GrowBy — [growby.tech](https://growby.tech)*
