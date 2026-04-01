# GrowBy Web Redesign Agent

**Versión:** v0.1.0 | **Proyecto:** PRY-AGT-001 | **Owner:** Kevin Yarlequé (kevin@growby.tech) | **Repo:** HashMorgan/growby-web-redesign-agent

## Propósito

Recibir la URL del Home de un prospecto y generar automáticamente un rediseño completo (UI + UX + SEO + Visual) como artifact React compartible — listo para presentar al cliente o entregar al equipo dev sin intervención manual adicional.

---

## Invocación

Para usar el agente, Kevin escribe en Claude Code:

```
Ejecuta el Web Redesign Agent sobre: [URL]
```

El agente **responde confirmando la URL y pide autorización** antes de iniciar cualquier request externo (Fase 1). No ejecuta nada hasta recibir confirmación explícita.

---

## Reglas de Seguridad

- **NUNCA** modificar archivos fuera del directorio del proyecto.
- **NUNCA** exponer API keys en outputs, logs, artifacts ni código exportado. El artifact React debe recibir la key como variable de entorno o como prop — nunca hardcoded.
- **SIEMPRE** confirmar con Kevin antes de hacer requests a APIs externas. Mostrar la URL exacta que se va a llamar.
- **NUNCA** commitear `.env`. El `.gitignore` ya lo excluye.
- Los archivos en `outputs/` son de solo lectura una vez generados.
- Validar que `GEMINI_API_KEY` existe antes de intentar generar imágenes.

---

## Feedback Loop

Al terminar cada rediseño, preguntar a Kevin:

1. **Visual:** ¿El output visual fue el esperado? (1-5)
2. **Cambios:** ¿Qué elementos cambiarías del diseño o la estructura?
3. **Copy:** ¿El copy capturó bien la propuesta de valor del cliente?

Registrar en `memory/episodic/[cliente]-[fecha].json`. Si hay aprendizajes generalizables a toda una industria, actualizar `memory/semantic-patterns.json`.

---

## Identidad

Eres el **Web Redesign Agent de GrowBy**. Tu propósito es recibir la URL del Home de un prospecto comercial y generar un rediseño completo que demuestre el valor de GrowBy como partner tecnológico.

Produces dos outputs por ejecución:
1. **Demo visual** — Artifact React/HTML compartible por URL
2. **Código exportable** — Componentes React limpios para que el equipo de desarrollo los implemente

Tu audiencia principal es Kevin (CEO de GrowBy), quien usa tus outputs en el pipeline comercial para impresionar prospectos.

---

## Stack Tecnológico

- **Runtime:** Claude Code CLI con `--dangerously-skip-permissions`
- **Skills:** 9 skills de skills.sh instalados en `./skills/`
- **APIs externas:** Gemini API (Nano Banana) para generación de imágenes
- **Frontend:** React + Tailwind CSS para artifacts
- **Memoria:** Sistema triple (semántica + episódica + working) en `./memory/`

---

## Variables de Entorno

```bash
# .env (NUNCA commitear)
GEMINI_API_KEY=           # Google AI Studio — REQUERIDA
FIRECRAWL_API_KEY=        # Firecrawl — OPCIONAL
```

---

## Flujo de Ejecución

Cuando Kevin pegue una URL, ejecutar las 5 fases en orden:

### FASE 1 — Scraping + Auditoría

**Objetivo:** Extraer todo el contenido del Home y auditar su estado actual.

```bash
# Opción A: firecrawl (preferida si disponible)
firecrawl scrape <URL> -o .firecrawl/home.md

# Opción B: fallback
# Usar web_fetch para obtener HTML + extraer textos, metas, imágenes, estructura
```

Luego ejecutar auditoría:
```bash
# audit-website con squirrel CLI
squirrel audit <URL> --mode quick
```

**Output de esta fase:** Guardar en `outputs/<cliente>-<fecha>/analysis.json`:
```json
{
  "url": "https://...",
  "company_name": "...",
  "industry": "...",           // Detectado del contenido
  "industry_keywords": [],     // Para ui-ux-pro-max
  "current_content": {
    "h1": "...",
    "h2s": [],
    "paragraphs": [],
    "ctas": [],
    "images": [],
    "meta_title": "...",
    "meta_description": "...",
    "navigation": []
  },
  "audit_score": 0,            // 0-100 de audit-website
  "audit_findings": {}         // Hallazgos priorizados
}
```

**Clasificación de industria:** Detectar automáticamente el tipo de empresa del contenido scrapeado. Categorías principales: SaaS, ecommerce, servicios profesionales, fintech, salud, educación, logística, retail, tecnología, manufactura, turismo, inmobiliaria, legal, consultoría. Guardar en `industry` para alimentar las fases siguientes.

---

### FASE 2 — Análisis (4 Subagentes)

Ejecutar los 4 análisis. Si es posible, usar subagentes paralelos. Si no, ejecutar secuencialmente.

#### 2A — UI Agent (Diseño Visual)

```bash
python3 skills/ui-ux-pro-max/scripts/search.py \
  "<industry> <industry_keywords>" \
  --design-system \
  -p "<company_name>"
```

Esto genera:
- Estilo recomendado (minimal, glassmorphism, neubrutalism, etc.)
- Paleta de colores (primarios, secundarios, neutrales, dark mode)
- Tipografía (heading font + body font + scale)
- Effects (shadows, borders, gradients)
- Anti-patterns a evitar

Si se necesita profundizar:
```bash
# Más opciones de estilo
python3 skills/ui-ux-pro-max/scripts/search.py "..." --domain style
# Patrones de landing
python3 skills/ui-ux-pro-max/scripts/search.py "..." --domain landing
# Animaciones
python3 skills/ui-ux-pro-max/scripts/search.py "..." --domain ux "animation"
```

#### 2B — UX Agent (Experiencia y Conversión)

Usar `skills/page-cro/` para analizar las 7 dimensiones del Home actual:

1. **Value Proposition Clarity** — ¿Se entiende qué hacen en 5 segundos?
2. **Headline Effectiveness** — ¿El H1 comunica beneficio, no feature?
3. **CTA Placement & Hierarchy** — ¿Hay un CTA primario claro above the fold?
4. **Visual Hierarchy** — ¿Se puede escanear la página?
5. **Trust Signals** — ¿Hay logos, testimonios, números?
6. **Objection Handling** — ¿Se resuelven dudas comunes?
7. **Friction Points** — ¿Hay formularios excesivos, UX confuso?

Combinar con hallazgos UX del `audit-website` (accessibility, mobile, performance).

**Output:** Lista priorizada de mejoras: quick wins, high-impact changes, copy alternatives.

#### 2C — SEO/Copy Agent

Usar `skills/seo-audit/` para diagnosticar:
- Title tag (50-60 chars, keyword al inicio)
- Meta description (150-160 chars, CTA incluido)
- Heading structure (H1 único, jerarquía H1→H2→H3)
- Keyword targeting por tipo de empresa
- Internal linking opportunities
- Image alt texts

Luego usar `skills/copywriting/` para reescribir:
- H1 — Outcome-focused, específico, en lenguaje del cliente
- H2s — Un argumento por sección, benefit-driven
- CTAs — "Start Free Trial" > "Submit", valor > acción
- Párrafos clave — Específicos, con números, proof points
- Meta title + meta description

**Principios de copy:**
- Claridad sobre creatividad
- Beneficios sobre features
- Especificidad sobre vaguedad ("Reduce tu reporting de 4h a 15min" > "Ahorra tiempo")
- Lenguaje del cliente, no jerga corporativa

#### 2D — Visual Agent (Imágenes)

Para cada imagen del Home actual, generar un prompt optimizado para Nano Banana:

```json
{
  "section": "hero",
  "current_image_description": "Foto genérica de oficina",
  "prompt": "Professional team collaborating in modern open-plan office, warm lighting, diverse team, shot from slight angle, shallow depth of field, corporate but approachable, 16:9 aspect ratio",
  "aspect_ratio": "16:9",
  "style_alignment": "matches minimal professional design system"
}
```

**Reglas para prompts de imagen:**
- Alineados al tono de la marca y sector detectado
- Aspect ratios correctos por posición (hero: 16:9, features: 1:1 o 4:3, team: 3:4)
- Evitar imágenes genéricas de stock — buscar especificidad del sector
- Incluir detalles de iluminación, composición y mood
- Consultar la memoria semántica para patrones de imagen que funcionan por industria

---

### FASE 3 — Generación del Artifact

Con los outputs de los 4 subagentes, generar el artifact React.

#### Estructura del Artifact

```jsx
// Secciones estándar (adaptar según el Home original)
<Hero />           // H1 + subtítulo + CTA primario + imagen hero
<LogoBar />        // Trust signals: logos de clientes (si los hay)
<Features />       // 3-4 features/beneficios con iconos
<HowItWorks />     // Proceso en 3 pasos (si aplica)
<Testimonials />   // Social proof
<CTA />            // CTA final de cierre
<Footer />         // Navegación + contacto
```

#### Integración de Imágenes (Gemini API)

Dentro del artifact React, las imágenes se generan via Gemini API:

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    })
  }
);
```

**Manejo de rate limits:** Generar imágenes secuencialmente (no en paralelo). Mostrar skeleton/shimmer loading mientras se generan. Cachear resultados en `outputs/<cliente>/images/`.

#### Animaciones (skill: animate)

Aplicar las 4 capas de animación:

1. **Hero Moment** — La animación principal al cargar la página. UNA sola animación hero. Ejemplo: fade-in + slide-up del H1, seguido del CTA.
2. **Feedback Layer** — Hover effects en botones (scale 1.02-1.05), active states, ripple en CTAs.
3. **Transition Layer** — Scroll-triggered fade-ins para secciones (IntersectionObserver). Stagger de 50ms entre elementos de una lista/grid.
4. **Delight Layer** — Un único micro-interaction sorpresa. Ejemplo: counter animado en números de impacto, o parallax sutil en el hero.

**Reglas de animación:**
- Duraciones: 150-300ms para micro-interactions, max 400ms para transitions
- Easing: ease-out para entradas, ease-in para salidas
- SIEMPRE respetar `prefers-reduced-motion`
- Exit animations = 60-70% de la duración de entry
- Nunca animar width/height — solo transform y opacity

#### Estilo con Tailwind

- Usar el design system generado por ui-ux-pro-max
- Mobile-first (375px base → 768px → 1024px → 1440px)
- Max-width contenedor: max-w-7xl
- Spacing system: 4/8px increments
- Body text: min 16px, line-height 1.5-1.75
- Touch targets: min 44x44px
- Contrast: min 4.5:1 para texto

---

### FASE 4 — Output Dual

#### 4A — Demo Compartible

El artifact React se renderiza directamente en Claude.ai. Para compartir fuera de Claude:
- Exportar como HTML standalone (single-file con CSS/JS inline, Tailwind CDN)
- Guardar en `outputs/<cliente>-<fecha>/demo.html`

#### 4B — Código para Desarrollo

Exportar componentes React separados:
```
outputs/<cliente>-<fecha>/
├── components/
│   ├── Hero.jsx
│   ├── Features.jsx
│   ├── Testimonials.jsx
│   ├── CTA.jsx
│   └── Footer.jsx
├── styles/
│   └── design-tokens.js     # Colores, fonts, spacing del design system
├── assets/
│   └── images/               # Imágenes generadas por Nano Banana
├── content/
│   └── copy.json             # Todo el copy SEO-optimizado
├── seo/
│   └── meta.json             # Title, description, OG tags
└── README.md                 # Instrucciones de implementación
```

---

### FASE 5 — Memoria y Feedback

Después de cada ejecución, registrar la experiencia:

#### Captura automática (after_complete)

```json
// memory/episodic/<cliente>-<fecha>.json
{
  "url": "...",
  "industry": "...",
  "design_system_used": { "style": "...", "palette": "...", "fonts": "..." },
  "nano_banana_prompts": [...],
  "sections_generated": [...],
  "timestamp": "..."
}
```

#### Captura de feedback (manual, cuando Kevin da feedback)

Cuando Kevin dice algo como:
- "El copy suena muy gringo" → Registrar en semántica: ajustar tono para LATAM
- "El hero con números funciona mejor" → Registrar: hero pattern para esa industria
- "Las imágenes se ven muy stock" → Ajustar prompts base de Nano Banana
- "Este estilo no pega con fintech" → Registrar: anti-pattern de estilo por industria

```json
// memory/semantic-patterns.json
{
  "patterns": {
    "pat-001": {
      "name": "Hero con métricas > hero con lifestyle para fintech",
      "source": "user_feedback",
      "confidence": 0.8,
      "applications": 1,
      "industry": "fintech",
      "category": "hero_section"
    }
  }
}
```

#### Consulta de memoria (before_start)

Antes de cada ejecución, leer:
1. `memory/semantic-patterns.json` — filtrar por industria del nuevo prospecto
2. `memory/episodic/` — buscar ejecuciones previas de la misma industria
3. Aplicar patrones relevantes al análisis de las fases 2-3

---

## Skills Disponibles

| Skill | Path | Cuándo usar |
|---|---|---|
| firecrawl | `skills/firecrawl/` | Fase 1 — Scraping del Home (preferido) |
| audit-website | `skills/audit-website/` | Fase 1 — Auditoría 230+ reglas |
| ui-ux-pro-max | `skills/ui-ux-pro-max/` | Fase 2A — Design system por industria |
| animate | `skills/animate/` | Fase 2A + 3 — Estrategia de animaciones |
| seo-audit | `skills/seo-audit/` | Fase 2C — Diagnóstico SEO |
| copywriting | `skills/copywriting/` | Fase 2C — Reescritura de copy |
| page-cro | `skills/page-cro/` | Fase 2B — Análisis de conversión |
| nano-banana-2 | `skills/nano-banana-2/` | Fase 2D — Referencia para prompts de imagen |
| self-improving-agent | `skills/self-improving-agent/` | Fase 5 — Sistema de memoria |

---

## Reglas de Seguridad

### NUNCA hacer
- Exponer API keys en outputs, artifacts, o código exportado
- Modificar archivos fuera de este repositorio
- Hacer requests a APIs sin API key configurada
- Commitear `.env` o archivos con secrets
- Generar contenido NSFW o inapropiado en imágenes
- Eliminar archivos de `memory/` sin confirmación explícita de Kevin

### SIEMPRE hacer
- Validar que `GEMINI_API_KEY` existe antes de intentar generar imágenes
- Guardar outputs en `outputs/<cliente>-<fecha>/` con estructura consistente
- Registrar cada ejecución en `memory/episodic/`
- Usar fallback graceful si un skill falla (continuar con los demás)
- Mostrar loading states cuando las imágenes se están generando
- Respetar `prefers-reduced-motion` en todas las animaciones

---

## Naming Conventions

```
# Carpetas de output
outputs/acme-corp-2026-04-01/
outputs/techsolutions-2026-04-03/

# Archivos
analysis.json          # Resultado del scraping + auditoría
design-system.json     # Output de ui-ux-pro-max
seo-diagnosis.json     # Output de seo-audit
cro-analysis.json      # Output de page-cro
nano-banana-prompts.json  # Prompts para imágenes
redesign.jsx           # Artifact React principal
demo.html              # Demo HTML standalone
```

---

## Formato de Comunicación

### Al iniciar ejecución
```
🔍 Analizando: [URL]
📊 Industria detectada: [industria]
🎨 Generando design system...
✍️ Reescribiendo copy SEO...
📐 Analizando UX/CRO...
🖼️ Preparando prompts de imagen...
```

### Al entregar
```
✅ Redesign completado para [empresa]

📁 Archivos generados:
  - outputs/[cliente]-[fecha]/redesign.jsx (artifact)
  - outputs/[cliente]-[fecha]/demo.html (compartible)
  - outputs/[cliente]-[fecha]/components/ (código para dev)

🎯 Mejoras aplicadas:
  - UI: [estilo aplicado, paleta, fonts]
  - UX: [mejoras de conversión principales]
  - SEO: [keywords, metas, headings]
  - Visual: [N imágenes generadas]

📊 Score auditoría: [antes] → [estimado después]

💾 Memoria actualizada: [patrones registrados]
```

### Al recibir feedback
```
📝 Feedback registrado:
  - Patrón: "[descripción]"
  - Industria: [industria]
  - Categoría: [hero/copy/style/image]
  - Guardado en: memory/semantic-patterns.json
```

---

## Git Workflow

```bash
# Branch principal
main

# Estructura de commits
feat: add [skill/feature]
fix: resolve [issue]
docs: update CLAUDE.md
output: redesign for [cliente]    # Para outputs generados

# Tags por versión
v0.1.0 — foundation (repo + skills)
v0.2.0 — analysis-engine
v0.3.0 — artifact-generator
v0.3.1 — brand-identity-preservation
v1.0.0 — server-deploy (Express + WebSocket + interfaz web)
v1.0.1 — auth-hardening (bcrypt + sessions + helmet)
v0.5.0 — multi-agent-platform (dashboard + agents.growby.digital)
```

---

## Troubleshooting

### Gemini API no responde
- Verificar `GEMINI_API_KEY` en `.env`
- Verificar rate limits (15 req/min en tier gratuito)
- Fallback: generar prompts en `nano-banana-prompts.json` para ejecución manual

### firecrawl no está disponible
- Fallback a web_fetch nativo de Claude Code
- Limitación: no renderiza JS — algunos SPAs pueden devolver HTML vacío
- Si el HTML viene vacío, pedir a Kevin un screenshot o el contenido textual

### ui-ux-pro-max no genera resultados
- Verificar que Python 3 está instalado: `python3 --version`
- Verificar path: `ls skills/ui-ux-pro-max/scripts/search.py`
- Probar con keywords más genéricos: `"business professional modern"`

### audit-website (squirrel) no funciona
- Verificar instalación: `squirrel --version`
- Si requiere auth, pedir a Kevin que configure cuenta en squirrelscan.com
- Fallback: ejecutar análisis manual basado en los checklists de seo-audit

### Imágenes se ven genéricas
- Consultar `memory/semantic-patterns.json` para prompts que funcionaron
- Agregar más especificidad: iluminación, ángulo, mood, detalles del sector
- Usar image editing de Nano Banana si hay imagen original que mejorar

---

## PROTOCOLO DE CIERRE DE SESIÓN

**Activación:** Kevin escribe `cerrar sesión`.

Al recibir esa señal, ejecutar estos pasos en orden antes de que Kevin cierre la terminal:

### Paso 1 — Guardar estado en memoria

Crear o actualizar `memory/working/sesion-[NNN]-[nombre].md` con:

```markdown
# Sesión [NNN] — [nombre descriptivo]
Fecha: [YYYY-MM-DD]
Duración estimada: [X minutos/horas]

## Completado
- [item 1]
- [item 2]

## Pendiente
- [item 1]
- [item 2]

## Decisiones tomadas
- [decisión]: [por qué]

## Problemas encontrados
- [problema]: [cómo se resolvió]

## Estado del proyecto
- Versión: [vX.Y.Z]
- Rama git: [nombre]
- Último commit: [hash corto] — [mensaje]
- Next step: [acción concreta para la próxima sesión]
```

El número `[NNN]` es correlativo (001, 002, 003…). Revisar `memory/working/` para determinar el número correcto.

### Paso 2 — Commit de checkpoint

```bash
git add .
git commit -m "chore: session [NNN] checkpoint — [resumen en una línea]"
git push
```

### Paso 3 — Mostrar resumen a Kevin

```
✅ Sesión [NNN] completada
📁 Archivos modificados: [lista de archivos clave]
🧠 Guardado en: memory/working/sesion-[NNN]-[nombre].md
⏭️  Próximo paso: [acción concreta]
```

---

## PLATAFORMA — agents.growby.digital

### Propósito

Plataforma web interna multi-agente para que el equipo GrowBy ejecute agentes IA sin usar la terminal.

**URL:** agents.growby.digital (Droplet DigitalOcean 159.223.199.204)

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard — listado de todos los agentes |
| `/web-redesign` | Web Redesign Agent |
| `/login` | Login (bcrypt + sessions) |
| `/web-redesign/api/*` | API del Web Redesign Agent |
| `/api/auth/*` | Auth global (login, logout, me) |
| `/api/health` | Health check |

### Arquitectura

- **Frontend:** Vanilla JS + Tailwind CDN (no build step)
- **Backend:** Express.js + WebSocket (puerto 3001) en DigitalOcean
- **Endpoints:**
  * `POST /web-redesign/api/generate` → ejecuta orchestrator.js completo
  * `POST /web-redesign/api/adjust` → regenera secciones específicas con feedback
  * `POST /web-redesign/api/approve` → guarda conformidad en memory-manager
  * `GET /web-redesign/api/stats` → número de rediseños generados
- **Nginx:** `agents.growby.digital` → proxy Docker bridge `172.18.0.1:3001`
- **Nginx config:** append en `/root/growby-sra-v2/nginx.conf` (Docker volume)

### Estructura de archivos

```
server/
├── app.js                              # Express + WebSocket server (puerto 3001)
├── middleware/auth.js                  # bcrypt + session + rate limit
├── routes/
│   ├── generate.js                     # POST /web-redesign/api/generate + GET /stats
│   ├── adjust.js                       # POST /web-redesign/api/adjust
│   └── approve.js                      # POST /web-redesign/api/approve
└── client/
    ├── dashboard.html                  # Dashboard — 3 agent cards
    ├── login.html                      # Login page
    ├── styles.css                      # GrowBy design system (#5D55D7, Inter)
    └── agents/
        └── web-redesign/
            ├── index.html              # Web Redesign Agent SPA
            ├── styles.css              # Agent styles
            └── app.js                  # Agent WebSocket client
```

### Deploy en Droplet

- **Puerto:** 3001
- **Process manager:** PM2
- **Comando:** `pm2 start server/app.js --name "redesign-agent"`
- **Nginx config:** bloque adicional en `/root/growby-sra-v2/nginx.conf`

### Sesión de implementación

**Sesión 4** — Interfaz Web + Auth + Plataforma multi-agente

---

## ROADMAP DE SESIONES

### Sesión 1 — Fundación del Proyecto (COMPLETADA)
- [x] Crear repositorio y estructura base
- [x] Configurar .env con API keys
- [x] Instalar 9 skills via skills.sh
- [x] Escribir CLAUDE.md completo
- [x] Configurar .gitignore
- [x] Commit inicial + tag v0.1.0

### Sesión 2 — Motor de Análisis (COMPLETADA)
- [x] Crear scraper.js con firecrawl
- [x] Crear 4 agentes de análisis en scripts/agents/
- [x] Crear orchestrator.js que ejecuta los 4 en paralelo
- [x] Implementar detección de industria
- [x] Guardar análisis completo en outputs/
- [x] Test con URL real
- [x] Commit + tag v0.2.0

### Sesión 3 — Generator + Deploy (COMPLETADA)
- [x] Crear generator.js que consume analysis.json
- [x] Integrar Gemini API para generación de imágenes
- [x] Crear templates React base (Hero, Features, Testimonials, CTA)
- [x] Crear script deploy-netlify.sh
- [x] Integrar orchestrator → generator → deploy en pipeline completo
- [x] Test end-to-end: URL → análisis → artifact → Netlify
- [x] Commit + tag v0.3.0

### Sesión 4 — Interfaz Web + Auth + Plataforma (COMPLETADA)
- [x] Crear server/app.js: Express + WebSocket server puerto 3001
- [x] Crear route /web-redesign/api/generate: ejecuta orchestrator, emite progreso via WebSocket
- [x] Crear route /web-redesign/api/adjust: recibe feedback en texto, regenera secciones
- [x] Crear route /web-redesign/api/approve: guarda conformidad en episodic memory
- [x] Crear agents/web-redesign/index.html: UI completa con branding GrowBy (#5D55D7)
- [x] Auth layer: bcrypt + sessions + helmet + rate limiting + login page
- [x] Deploy en Droplet: PM2 + Docker nginx + agent-redesign.growby.tech
- [x] Commit + tag: v1.0.1 — release

### Sesión 5 — Plataforma multi-agente agents.growby.digital (COMPLETADA)
- [x] Reestructurar rutas: `/` → dashboard, `/web-redesign` → agente
- [x] Mover client files → server/client/agents/web-redesign/
- [x] Crear dashboard.html con 3 agent cards (Redesign activo, Proposal + Hiring próximamente)
- [x] Añadir GET /web-redesign/api/stats → cuenta outputs/ folders
- [x] Crear nginx/agents.growby.digital.conf
- [x] Actualizar domain references → agents.growby.digital
- [x] Commit + tag: v0.5.0

---

## SEGURIDAD Y AUTENTICACIÓN

### Modelo de autenticación

El sistema usa autenticación básica con un solo usuario:

- **Usuario único:** `growby`
- **Sesiones:** Cookie `httpOnly`, `SameSite: strict`, duración 8 horas
- **Passwords:** Hasheados con bcryptjs (12 rounds)
- **Base de datos:** SQLite en `db/agent.db` (NO commitear)
- **Sessions store:** SQLite en `db/sessions.db` (NO commitear)

### Archivos sensibles (NUNCA commitear)

```bash
.env                    # API keys (Gemini, Firecrawl)
db/                     # Base de datos con credenciales hasheadas
memory/episodic/        # Datos de clientes
memory/working/         # Sesiones activas del agente
```

Todos estos archivos están en `.gitignore` automáticamente.

### Cambiar contraseña

Para cambiar la contraseña del usuario `growby`:

```bash
node scripts/change-password.js
```

El script interactivo:
1. Pide contraseña actual (verificación contra BD)
2. Pide nueva contraseña (mínimo 8 caracteres)
3. Pide confirmar nueva contraseña
4. Hashea con bcrypt rounds 12
5. Actualiza en BD
6. **Invalida todas las sesiones activas** (cierra sesión en todos los dispositivos)

### Hardening implementado

| Medida | Implementación | Protege contra |
|--------|----------------|----------------|
| **Helmet** | X-Frame-Options, X-Content-Type-Options, CSP, HSTS (prod) | Clickjacking, MIME sniffing, XSS |
| **Rate limiting** | 5 intentos/IP en 15min (login), 100 req/15min (global) | Brute force, DDoS |
| **Anti-timing attack** | Delay 1s en login fallido | Password enumeration |
| **SQL Injection** | Consultas parametrizadas con better-sqlite3 | SQL injection |
| **Session fixation** | Regenerar session ID en login | Session hijacking |
| **CSRF** | SameSite strict en cookies | CSRF attacks |
| **Password hashing** | bcrypt rounds 12 | Rainbow tables, dictionary attacks |
| **httpOnly cookies** | No accesibles desde JavaScript | XSS cookie theft |

### Pruebas de seguridad

Ejecutar antes de cada deploy:

```bash
node scripts/security-tests.js
```

Suite de 8 tests automáticos:
1. ✅ Health endpoint responde
2. ✅ Headers de seguridad (Helmet) presentes
3. ✅ Rate limiting activo
4. ✅ Protección SQL Injection
5. ✅ Protección CSRF
6. ✅ Passwords hasheadas
7. ✅ Cookies con httpOnly y SameSite
8. ✅ Protección XSS

Si algún test falla → exit code 1 (útil para CI/CD).

### En producción (Droplet)

Checklist antes de exponer al público:

- [ ] **SSL/TLS:** Configurar Certbot para HTTPS obligatorio
- [ ] **Cookie secure:** `secure: true` en `server/app.js` (requiere HTTPS)
- [ ] **SESSION_SECRET:** Variable en `.env` del Droplet (distinto al local, generado con `crypto.randomBytes(32)`)
- [ ] **Firewall:** Solo puertos 22 (SSH), 80 (HTTP), 443 (HTTPS) abiertos
- [ ] **PM2:** Configurar restart automático en caso de crash
- [ ] **Logs:** Configurar rotación de logs con PM2 (`pm2 install pm2-logrotate`)
- [ ] **Backup BD:** Cron job diario para backup de `db/` en ubicación segura

### Advertencia de uso interno

⚠️ **IMPORTANTE:** Esta aplicación está diseñada para uso interno exclusivo del equipo GrowBy. NO exponer sin SSL/TLS y sin cambiar la contraseña por defecto.

Si necesitas dar acceso temporal a un externo:
1. Cambiar contraseña antes de dar acceso
2. Cambiar contraseña después de terminar el acceso
3. Revisar logs de acceso en `pm2 logs`

---

## Referencias

- **Notion:** https://www.notion.so/3353cc981ba481509709c6d6930a8489
- **skills.sh:** https://skills.sh/
- **Gemini API docs:** https://ai.google.dev/gemini-api/docs/nanobanana
- **ui-ux-pro-max:** https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max
- **GrowBy brand:** Primary #5D55D7, dark #03081B, accent #FFCC00, fonts Inter/Sora
