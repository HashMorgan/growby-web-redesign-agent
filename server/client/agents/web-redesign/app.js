// ═══════════════════════════════════════════════════════════════════════════
// GROWBY WEB REDESIGN AGENT v3.0.0 — CLIENT APP (3-STEP FLOW)
// ═══════════════════════════════════════════════════════════════════════════

// ─── STATE MANAGEMENT ──────────────────────────────────────────────────────
const appState = {
  currentStep: 1,
  selectedMethod: null, // 'stitch' | 'pipeline'
  url: '',
  context: '',
  jobId: null
};

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
        ? '<div class="dot"></div><span class="hidden sm:inline">Conectado</span>'
        : '<div class="dot"></div><span class="hidden sm:inline">Desconectado</span>';
    }
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
  }

  success(message, duration) { this.show(message, 'success', duration); }
  error(message, duration) { this.show(message, 'error', duration); }
  warning(message, duration) { this.show(message, 'warning', duration); }
  info(message, duration) { this.show(message, 'info', duration); }
}

// ─── INITIALIZATION ────────────────────────────────────────────────────────
const toastManager = new ToastManager();
const wsManager = new WebSocketManager(handleWebSocketMessage);

// ─── STEP NAVIGATION ───────────────────────────────────────────────────────
function showStep(stepNumber) {
  appState.currentStep = stepNumber;

  // Hide all panels
  document.getElementById('step1Panel').classList.add('hidden');
  document.getElementById('step2Panel').classList.add('hidden');
  document.getElementById('step3Panel').classList.add('hidden');

  // Show target panel
  document.getElementById(`step${stepNumber}Panel`).classList.remove('hidden');
}

// ─── STEP 1: METHOD SELECTION ──────────────────────────────────────────────
document.querySelectorAll('.method-card').forEach(card => {
  card.addEventListener('click', () => {
    const method = card.dataset.method;
    appState.selectedMethod = method;

    // Update label
    const labels = {
      stitch: '🎨 Stitch AI',
      pipeline: '⚡ Pipeline GrowBy'
    };
    document.getElementById('selectedMethodLabel').textContent = labels[method];

    // Advance to step 2
    showStep(2);

    // Enable validation
    validateStep2();
  });
});

// Back to step 1
document.getElementById('backToStep1').addEventListener('click', () => {
  showStep(1);
  appState.selectedMethod = null;
});

// ─── STEP 2: URL + CONTEXT ─────────────────────────────────────────────────
const urlInput = document.getElementById('urlInput');
const contextInput = document.getElementById('contextInput');
const generateBtn = document.getElementById('generateBtn');

function validateStep2() {
  const url = urlInput.value.trim();
  const context = contextInput.value.trim();
  const isValid = url.length > 0 && context.length > 10 &&
    (url.startsWith('http://') || url.startsWith('https://'));

  generateBtn.disabled = !isValid;
}

urlInput.addEventListener('input', validateStep2);
contextInput.addEventListener('input', validateStep2);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !generateBtn.disabled) generateBtn.click();
});

generateBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  const context = contextInput.value.trim();

  if (!url || !context) {
    toastManager.error('Por favor completa todos los campos');
    return;
  }

  appState.url = url;
  appState.context = context;

  // Disable button
  generateBtn.disabled = true;
  generateBtn.textContent = 'Iniciando...';

  try {
    // Call API
    const response = await fetch('/web-redesign/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method: appState.selectedMethod,
        context
      })
    });

    const data = await response.json();

    if (response.ok) {
      appState.jobId = data.jobId;

      // Setup steps based on method
      setupProgressSteps(appState.selectedMethod);

      // Show step 3 (progress)
      showStep(3);
      document.getElementById('progressSection').classList.remove('hidden');
      document.getElementById('resultSection').classList.add('hidden');

    } else {
      toastManager.error(data.error || 'Error al iniciar el rediseño');
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generar Rediseño →';
    }
  } catch (error) {
    toastManager.error('Error de conexión: ' + error.message);
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generar Rediseño →';
  }
});

// ─── STEP 3: PROGRESS ──────────────────────────────────────────────────────
function setupProgressSteps(method) {
  const stepsContainer = document.getElementById('stepsContainer');

  const stepsConfig = {
    stitch: [
      { id: 'analyzing', icon: '🔍', label: 'Analizando' },
      { id: 'generating', icon: '🎨', label: 'Stitch AI' },
      { id: 'deploying', icon: '🚀', label: 'Publicando' }
    ],
    pipeline: [
      { id: 'scraping', icon: '🔍', label: 'Scraping' },
      { id: 'analysis', icon: '🧠', label: 'Análisis' },
      { id: 'design', icon: '🎨', label: 'Diseño' },
      { id: 'deploying', icon: '🚀', label: 'Publicando' }
    ]
  };

  const steps = stepsConfig[method] || stepsConfig.stitch;

  stepsContainer.innerHTML = steps.map((step, i) => `
    <div class="step" id="step-${step.id}">
      <div class="step-icon">${step.icon}</div>
      <div class="step-label">${step.label}</div>
      <div class="step-status">⏳</div>
    </div>
    ${i < steps.length - 1 ? '<div class="flex-1 h-0.5 bg-gray-700 mx-2"></div>' : ''}
  `).join('');
}

function updateProgress(data) {
  const { step, message, progress } = data;

  // Update progress bar
  document.getElementById('progressBar').style.width = `${progress}%`;
  document.getElementById('currentMessage').textContent = message;

  // Add to log
  addLogEntry(message);

  // Update step status
  const stepMap = {
    scraping: 'scraping',
    analyzing: 'analyzing',
    prompt: 'analyzing',
    generating: 'generating',
    deploying: 'deploying'
  };

  const targetStep = stepMap[step];
  if (targetStep) {
    updateStepStatus(targetStep, progress >= 100 ? 'complete' : 'active');
  }
}

function updateStepStatus(stepId, status) {
  const step = document.getElementById(`step-${stepId}`);
  if (!step) return;

  step.classList.remove('active', 'complete');

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

function addLogEntry(message) {
  const time = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${time}] ${message}`;
  const container = document.getElementById('logContainer');
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

// ─── WEBSOCKET MESSAGE HANDLER ─────────────────────────────────────────────
function handleWebSocketMessage(data) {
  if (data.jobId !== appState.jobId) return;

  updateProgress(data);

  if (data.step === 'complete') {
    handleComplete(data);
  } else if (data.step === 'error') {
    handleError(data);
  }
}

function handleComplete(data) {
  // Hide progress, show result
  document.getElementById('progressSection').classList.add('hidden');
  document.getElementById('resultSection').classList.remove('hidden');

  const { publicUrl, privateUrl } = data;

  // Mostrar ambas URLs
  document.getElementById('publicUrlInput').value = publicUrl || '';
  document.getElementById('privateUrlInput').value = privateUrl || '';

  // Cargar preview usando privateUrl (el usuario está autenticado)
  if (privateUrl) loadPreview(privateUrl);

  toastManager.success('✅ Rediseño completado y publicado');
}

function handleError(data) {
  document.getElementById('currentMessage').textContent = data.message;
  document.getElementById('currentMessage').style.color = 'var(--color-error)';
  toastManager.error(data.message || 'Error al procesar');
}

// ─── RESULT ACTIONS ────────────────────────────────────────────────────────
function loadPreview(url) {
  const iframe = document.getElementById('previewIframe');
  const skeleton = document.getElementById('previewSkeleton');

  if (skeleton) skeleton.style.display = 'block';

  iframe.src = url;
  iframe.onload = () => {
    if (skeleton) skeleton.style.display = 'none';
    iframe.classList.add('loaded');
  };
}

document.getElementById('copyPublicUrlBtn').addEventListener('click', async () => {
  const url = document.getElementById('publicUrlInput').value;
  if (!url) {
    toastManager.error('URL no disponible');
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toastManager.success('Link del cliente copiado ✅', 2000);
  } catch (_) {
    document.getElementById('publicUrlInput').select();
    document.execCommand('copy');
    toastManager.success('Link copiado', 2000);
  }
});

document.getElementById('copyPrivateUrlBtn').addEventListener('click', async () => {
  const url = document.getElementById('privateUrlInput').value;
  if (!url) {
    toastManager.error('URL no disponible');
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toastManager.success('Link privado copiado', 2000);
  } catch (_) {
    document.getElementById('privateUrlInput').select();
    document.execCommand('copy');
    toastManager.success('Link copiado', 2000);
  }
});

document.getElementById('openTabBtn').addEventListener('click', () => {
  const url = document.getElementById('privateUrlInput').value;
  if (!url) {
    toastManager.error('URL no disponible');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
});

document.getElementById('fullscreenBtn').addEventListener('click', () => {
  const iframe = document.getElementById('previewIframe');
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  } else if (iframe.webkitRequestFullscreen) {
    iframe.webkitRequestFullscreen();
  } else if (iframe.src) {
    window.open(iframe.src, '_blank', 'noopener,noreferrer');
  }
});

document.getElementById('newRedesignBtn').addEventListener('click', () => {
  // Reset state
  appState.currentStep = 1;
  appState.selectedMethod = null;
  appState.url = '';
  appState.context = '';
  appState.jobId = null;

  // Clear inputs
  urlInput.value = '';
  contextInput.value = '';
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generar Rediseño →';

  // Reset progress
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('logContainer').innerHTML = '';

  // Show step 1
  showStep(1);
});

console.log('✅ GrowBy Redesign Agent v3.0.0 — Cliente inicializado');
