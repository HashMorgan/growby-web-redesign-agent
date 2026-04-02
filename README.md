# GrowBy Web Redesign Agent

![Status](https://img.shields.io/badge/status-Production-green)
![Version](https://img.shields.io/badge/version-v3.2.0-blue)
![Stack](https://img.shields.io/badge/stack-Stitch%20AI%20%2B%20Express%20%2B%20WebSocket%20%2B%20React%20%2B%20Tailwind-purple)

Agente de IA especializado en rediseño web automático. Recibe la URL del home de un prospecto y genera, en una sola sesión, un rediseño completo de UI + UX + SEO + Visual como artifact React compartible — listo para presentar al cliente o entregar al equipo de desarrollo.

---

## Arquitectura v3.2.0 — Plataforma Web Multi-Agente

**URL producción:** https://agents.growby.digital

### Interfaz Web (3-step flow)

```
PASO 1 — Selección de método
  🎨 Stitch AI      → Google Gemini 3 Flash (creativo, rápido)
  ⚡ Pipeline GrowBy → Análisis profundo + templates (SEO, CRO)

PASO 2 — Input del usuario
  URL del sitio + Objetivo del rediseño (contexto)
  Validación en tiempo real

PASO 3 — Progreso en tiempo real (WebSocket)
  → Generación de HTML completo
  → Preview iframe + dual URLs instantáneas
```

### Pipeline de generación

```
FASE 1 — SCRAPING
  quick-scrape.js → Fetch nativo (title, metas, keywords)
  
FASE 2 — GENERACIÓN (según método elegido)
  
  🎨 STITCH AI:
     stitch-simple.js → Stitch SDK (Google Gemini 3 Flash)
     → outputs/[jobId]/index.html
  
  ⚡ PIPELINE GROWBY:
     html-builder.js → Templates React + Tailwind
     → outputs/[jobId]/index.html

FASE 3 — PUBLICACIÓN (self-hosted, 0 segundos)
  ✅ URL PÚBLICA  — /demo/[jobId]/index.html (sin auth, para clientes)
  ✅ URL PRIVADA  — /redesigns/[jobId]/index.html (requireAuth, para equipo)
  
  Ventajas vs Netlify:
  • URLs instantáneas (0s vs 30-60s)
  • Sin límites de deploys
  • Control total en Droplet propio
  • Seguridad por oscuridad (jobId largo)

MEMORIA — Feedback loop continuo
  → memory/episodic/[cliente]-[fecha].json
  → memory/semantic-patterns.json (aprendizaje por industria)
```

### Stack tecnológico

- **Backend:** Express.js + WebSocket (ws)
- **Frontend:** Vanilla JS + Tailwind CDN
- **Auth:** bcrypt + express-session + SQLite
- **Design:** Stitch AI SDK / HTML builder templates
- **Deploy:** PM2 + DigitalOcean Droplet + Nginx
- **Hosting:** Self-hosted dual URLs (/demo público + /redesigns privado)

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

### Desde la plataforma web (recomendado)

1. Accede a https://agents.growby.digital
2. Login con credenciales del equipo GrowBy
3. Click en "Web Redesign Agent"
4. Elige método: **Stitch AI** (rápido) o **Pipeline GrowBy** (analítico)
5. Ingresa URL + objetivo del rediseño
6. Observa progreso en tiempo real via WebSocket
7. Al completar, obtienes:
   - **Link del cliente** (público, sin login) → /demo/
   - **Link privado** (requiere auth) → /redesigns/
   - Preview iframe + botón descargar HTML

### Desde Claude Code (programático)

Escribe:

```
Ejecuta el Web Redesign Agent sobre: https://url-del-prospecto.com
```

El agente confirmará la URL y pedirá autorización antes de iniciar requests externos.

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

## Desarrollo local

```bash
# Iniciar servidor en modo desarrollo
cd server
node app.js

# El servidor escucha en http://localhost:3001
# Dashboard: http://localhost:3001/
# Web Redesign: http://localhost:3001/web-redesign

# Cambiar contraseña del usuario
node scripts/change-password.js

# Tests de seguridad
node scripts/security-tests.js
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
