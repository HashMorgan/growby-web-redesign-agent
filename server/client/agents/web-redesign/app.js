// ═══════════════════════════════════════════════════════════════════════════
// GROWBY WEB REDESIGN AGENT — CLIENT APP
// ═══════════════════════════════════════════════════════════════════════════

// ─── WEBSOCKET MANAGER ─────────────────────────────────────────────────────
class WebSocketManager {
  constructor(onMessage) {
    this.ws = null;
    this.onMessage = onMessage;
    this.reconnectInterval = 3000;
    this.isConnected = false;
    this.connect();
  }

  connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${location.host}`);

    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.updateConnectionStatus(true);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('📡 WebSocket cerrado. Reconectando...');
      this.isConnected = false;
      this.updateConnectionStatus(false);
      setTimeout(() => this.connect(), this.reconnectInterval);
    };
  }

  updateConnectionStatus(connected) {
    const badge = document.getElementById('connectionBadge');
    if (badge) {
      badge.className = `connection-badge ${connected ? 'connected' : 'disconnected'}`;
      badge.innerHTML = connected
        ? '<div class="dot"></div><span>Conectado</span>'
        : '<div class="dot"></div><span>Desconectado</span>';
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// ─── JOB MANAGER ───────────────────────────────────────────────────────────
class JobManager {
  constructor() {
    this.currentJobId = null;
    this.versions = [];
    this.currentVersion = 1;
    this.netlifyUrls = new Map();
  }

  startJob(jobId) {
    this.currentJobId = jobId;
    this.versions = [{ number: 1, url: null, timestamp: new Date() }];
    this.currentVersion = 1;
  }

  addVersion(url) {
    const version = this.versions.length + 1;
    this.versions.push({ number: version, url, timestamp: new Date() });
    this.currentVersion = version;
    this.netlifyUrls.set(version, url);
    return version;
  }

  getCurrentUrl() {
    const version = this.versions.find(v => v.number === this.currentVersion);
    return version ? version.url : null;
  }

  getJobId() {
    return this.currentJobId;
  }
}

// ─── UI MANAGER ────────────────────────────────────────────────────────────
class UIManager {
  constructor() {
    this.elements = {
      idlePanel: document.getElementById('idlePanel'),
      progressPanel: document.getElementById('progressPanel'),
      resultPanel: document.getElementById('resultPanel'),
      urlInput: document.getElementById('urlInput'),
      generateBtn: document.getElementById('generateBtn'),
      progressBar: document.getElementById('progressBar'),
      currentMessage: document.getElementById('currentMessage'),
      logContainer: document.getElementById('logContainer'),
      netlifyUrl: document.getElementById('netlifyUrl'),
      previewIframe: document.getElementById('previewIframe'),
      previewSkeleton: document.getElementById('previewSkeleton'),
      copyUrlBtn: document.getElementById('copyUrlBtn'),
      openTabBtn: document.getElementById('openTabBtn'),
      feedbackText: document.getElementById('feedbackText'),
      adjustBtn: document.getElementById('adjustBtn'),
      approveBtn: document.getElementById('approveBtn'),
      approvalComment: document.getElementById('approvalComment'),
      approvalMessage: document.getElementById('approvalMessage'),
      versionBadge: document.getElementById('versionBadge'),
      versionsPanel: document.getElementById('versionsPanel'),
      stars: document.querySelectorAll('.star'),
      ratingText: document.getElementById('ratingText'),
    };
    this.currentRating = 0;
  }

  showIdle() {
    this.elements.idlePanel.classList.remove('hidden');
    this.elements.progressPanel.classList.add('hidden');
    this.elements.resultPanel.classList.add('hidden');
  }

  showProgress() {
    this.elements.idlePanel.classList.add('hidden');
    this.elements.progressPanel.classList.remove('hidden');
    this.elements.resultPanel.classList.add('hidden');
  }

  showResult() {
    this.elements.progressPanel.classList.add('hidden');
    this.elements.resultPanel.classList.remove('hidden');
  }

  updateProgress(data) {
    const { step, message, progress } = data;

    // Update progress bar
    this.elements.progressBar.style.width = `${progress}%`;
    this.elements.currentMessage.textContent = message;

    // Add to log
    this.addLogEntry(message);

    // Update step icons
    const stepMap = {
      scraping: 'scraping',
      analysis: 'analysis',
      ui_agent: 'design',
      ux_agent: 'design',
      seo_agent: 'design',
      visual_agent: 'design',
      generating: 'generating',
      images: 'generating',
      deploying: 'deploy'
    };

    const targetStep = stepMap[step];
    if (targetStep) {
      this.updateStepStatus(targetStep, progress >= 100 ? 'complete' : 'active');
    }
  }

  updateStepStatus(stepId, status) {
    const step = document.getElementById(`step-${stepId}`);
    if (!step) return;

    // Remove previous states
    step.classList.remove('active', 'complete');

    // Add new state
    if (status === 'active') {
      step.classList.add('active');
      const statusEl = step.querySelector('.step-status');
      if (statusEl) statusEl.textContent = '🔄';
    } else if (status === 'complete') {
      step.classList.add('complete');
      const statusEl = step.querySelector('.step-status');
      if (statusEl) statusEl.textContent = '✅';
    }
  }

  addLogEntry(message) {
    const time = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${time}] ${message}`;
    this.elements.logContainer.appendChild(entry);
    this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
  }

  setGenerateButtonState(state) {
    const btn = this.elements.generateBtn;
    btn.classList.remove('loading');

    switch (state) {
      case 'loading':
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = 'Analizando...';
        break;
      case 'complete':
        btn.disabled = false;
        btn.textContent = '✅ Listo — Generar otro';
        btn.classList.remove('btn-primary');
        btn.style.background = '#16a34a';
        break;
      default:
        btn.disabled = false;
        btn.textContent = 'Generar Rediseño';
        btn.className = 'btn-primary w-full py-4 rounded-lg text-white font-semibold text-lg';
    }
  }

  loadPreview(url) {
    const iframe = this.elements.previewIframe;
    const skeleton = this.elements.previewSkeleton;

    if (skeleton) skeleton.style.display = 'block';

    iframe.src = url;
    iframe.onload = () => {
      if (skeleton) skeleton.style.display = 'none';
      iframe.classList.add('loaded');
    };
  }

  updateVersions(versions, currentVersion) {
    const panel = this.elements.versionsPanel;
    if (!panel) return;

    panel.innerHTML = versions.map(v => `
      <span class="version ${v.number === currentVersion ? 'active' : ''}" data-version="${v.number}" data-url="${v.url || ''}">
        v${v.number}${v.number === 1 ? ' — Original' : ' — Ajuste'}
      </span>
    `).join('');

    panel.classList.remove('hidden');

    // Add click handlers
    panel.querySelectorAll('.version').forEach(el => {
      el.addEventListener('click', () => {
        const url = el.dataset.url;
        if (url) {
          this.loadPreview(url);
          panel.querySelectorAll('.version').forEach(v => v.classList.remove('active'));
          el.classList.add('active');
        }
      });
    });
  }

  setupStarRating(onRatingChange) {
    this.elements.stars.forEach(star => {
      star.addEventListener('click', () => {
        this.currentRating = parseInt(star.dataset.rating);

        this.elements.stars.forEach((s, i) => {
          if (i < this.currentRating) {
            s.classList.add('active');
            s.textContent = '★';
          } else {
            s.classList.remove('active');
            s.textContent = '☆';
          }
        });

        const ratingLabels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
        this.elements.ratingText.textContent = ratingLabels[this.currentRating];

        if (onRatingChange) onRatingChange(this.currentRating);
      });
    });
  }
}

// ─── TOAST MANAGER ─────────────────────────────────────────────────────────
class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 4000) {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// APP INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

const jobManager = new JobManager();
const uiManager = new UIManager();
const toastManager = new ToastManager();

// WebSocket message handler
const wsManager = new WebSocketManager((data) => {
  if (data.jobId !== jobManager.getJobId()) return;

  uiManager.updateProgress(data);

  if (data.step === 'complete') {
    handleComplete(data);
  } else if (data.step === 'adjusted') {
    handleAdjusted(data);
  } else if (data.step === 'error') {
    handleError(data);
  }
});

// ─── EVENT HANDLERS ────────────────────────────────────────────────────────

function handleComplete(data) {
  uiManager.showResult();
  uiManager.setGenerateButtonState('complete');

  const { netlifyUrl, outputPath } = data;
  uiManager.elements.netlifyUrl.value = netlifyUrl || '';
  uiManager.loadPreview(netlifyUrl || '');

  jobManager.versions[0].url = netlifyUrl;
  uiManager.updateVersions(jobManager.versions, 1);

  toastManager.success('✅ Rediseño publicado en Netlify');

  // Setup buttons
  uiManager.elements.copyUrlBtn.onclick = () => {
    navigator.clipboard.writeText(uiManager.elements.netlifyUrl.value);
    toastManager.success('URL copiada al portapapeles', 2000);
  };

  uiManager.elements.openTabBtn.onclick = () => {
    window.open(uiManager.elements.netlifyUrl.value, '_blank');
  };
}

function handleAdjusted(data) {
  const version = jobManager.addVersion(data.netlifyUrl);

  uiManager.elements.netlifyUrl.value = data.netlifyUrl || '';
  uiManager.loadPreview(data.netlifyUrl || '');
  uiManager.elements.versionBadge.textContent = `Versión ${version}`;
  uiManager.updateVersions(jobManager.versions, version);

  uiManager.elements.feedbackText.value = '';

  toastManager.info(`🔧 Ajuste aplicado — versión ${version} lista`);
}

function handleError(data) {
  uiManager.elements.currentMessage.textContent = data.message;
  uiManager.elements.currentMessage.style.color = 'var(--color-error)';
  uiManager.setGenerateButtonState('idle');
  toastManager.error(data.message || 'Error al procesar — intenta de nuevo');
}

// ─── GENERATE REDESIGN ─────────────────────────────────────────────────────

uiManager.elements.generateBtn.onclick = async () => {
  const url = uiManager.elements.urlInput.value.trim();
  console.log('Botón clickeado, URL:', url);

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    toastManager.error('Por favor ingresa una URL válida que comience con http:// o https://');
    return;
  }

  uiManager.setGenerateButtonState('loading');

  try {
    const response = await fetch('/web-redesign/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (response.ok) {
      jobManager.startJob(data.jobId);
      uiManager.showProgress();
    } else {
      toastManager.error(data.error || 'Error al iniciar el rediseño');
      uiManager.setGenerateButtonState('idle');
    }
  } catch (error) {
    toastManager.error('Error de conexión: ' + error.message);
    uiManager.setGenerateButtonState('idle');
  }
};

// ─── ADJUST REDESIGN ───────────────────────────────────────────────────────

uiManager.elements.adjustBtn.onclick = async () => {
  const feedback = uiManager.elements.feedbackText.value.trim();

  if (!feedback) {
    toastManager.warning('Por favor describe qué cambiarías');
    return;
  }

  uiManager.elements.adjustBtn.disabled = true;
  uiManager.elements.adjustBtn.textContent = '⏳ Aplicando...';

  try {
    const response = await fetch('/web-redesign/api/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: jobManager.getJobId(), feedback })
    });

    const data = await response.json();

    if (!response.ok) {
      toastManager.error(data.error || 'Error al aplicar ajuste');
    }
  } catch (error) {
    toastManager.error('Error de conexión: ' + error.message);
  } finally {
    uiManager.elements.adjustBtn.disabled = false;
    uiManager.elements.adjustBtn.textContent = 'Aplicar Ajuste';
  }
};

// ─── APPROVE REDESIGN ──────────────────────────────────────────────────────

uiManager.setupStarRating((rating) => {
  uiManager.elements.approveBtn.disabled = rating === 0;
});

uiManager.elements.approveBtn.onclick = async () => {
  if (uiManager.currentRating === 0) {
    toastManager.warning('Por favor selecciona una calificación');
    return;
  }

  uiManager.elements.approveBtn.disabled = true;
  uiManager.elements.approveBtn.textContent = '⏳ Guardando...';

  try {
    const response = await fetch('/web-redesign/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: jobManager.getJobId(),
        score: uiManager.currentRating,
        feedback: uiManager.elements.approvalComment.value.trim() || null
      })
    });

    const data = await response.json();

    if (response.ok) {
      uiManager.elements.approvalMessage.classList.remove('hidden');
      uiManager.elements.approvalMessage.textContent = data.message || '🧠 El agente aprendió de este rediseño';
      uiManager.elements.approveBtn.textContent = '✅ Aprobado';

      toastManager.success('🧠 Aprendizaje guardado correctamente');
    } else {
      toastManager.error(data.error || 'Error al guardar aprobación');
      uiManager.elements.approveBtn.disabled = false;
      uiManager.elements.approveBtn.textContent = '✅ Aprobar y Guardar Aprendizaje';
    }
  } catch (error) {
    toastManager.error('Error de conexión: ' + error.message);
    uiManager.elements.approveBtn.disabled = false;
    uiManager.elements.approveBtn.textContent = '✅ Aprobar y Guardar Aprendizaje';
  }
};

// ─── ENTER KEY HANDLER ─────────────────────────────────────────────────────

uiManager.elements.urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    uiManager.elements.generateBtn.click();
  }
});

console.log('✅ GrowBy Redesign Agent — Cliente inicializado');
