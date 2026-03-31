/* ============================================================
   app.js — Main Application Bootstrap
   ============================================================ */

/* Shared app state */
const AppState = {
  currentType: 'url',
  currentPayload: '',
  currentOptions: {
    errorCorrectionLevel: 'M',
    size: 256,
    moduleColor: '#000000',
    colorDark: '#000000',
    colorLight: '#ffffff',
    finderOuterColor: '#000000',
    finderInnerColor: '#000000',
    dotStyle: 'square',
    finderStyle: 'square',
    margin: 16,
    useGradient: false,
    gradientType: 'linear',
    gradientStart: '#000000',
    gradientEnd: '#2563eb',
    backgroundTransparent: false,
    logoSizeRatio: 0.22,
    logoPadding: 6,
    logoShape: 'square',
    logoCornerRadius: 8
  }
};
window.AppState = AppState;

let _logoRenderToken = 0;

/* Debounce helper */
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ---- Bootstrap ---- */
document.addEventListener('DOMContentLoaded', async () => {

  // Show loading overlay
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(overlay);

  try {
    // Load config
    const config = await fetch('data/config.json').then(r => r.json());
    window.AppConfig = config;

    // Render dynamic sections
    renderQRTypeGrid(config.qrTypes);

    // Init UI modules
    UI.initCollapsibles();
    UI.initAccordion();
    UI.initPreviewControls();
    UI.initSizeRange();
    UI.initLogoUpload(onLogoChange);

    // Select default type
    selectQRType('url');

    // Bind styling controls
    bindStylingControls();
    initStylePresets();

    // Bind export buttons
    bindExportButtons();

    // Bind file encoder
    bindFileEncoder();

    // Bind copy payload
    document.body.addEventListener('click', e => {
      if (e.target.id === 'copy-payload-btn') copyPayload();
    });

    // Update document title from config
    document.title = `${config.site.name} — by Mightora`;

  } catch (err) {
    console.error('App init error:', err);
    UI.showToast('Failed to load configuration. Some features may be unavailable.', 'error', 6000);
  }

  // Remove loading overlay
  document.getElementById('loading-overlay')?.remove();
});

/* ---- QR Type Grid ---- */

function renderQRTypeGrid(typeIds) {
  const grid = document.getElementById('qr-type-grid');
  if (!grid) return;
  grid.innerHTML = '';

  typeIds.forEach(id => {
    const type = QRTypes[id];
    if (!type) return;

    const card = document.createElement('div');
    card.className = 'qr-type-card';
    card.dataset.typeId = id;
    card.innerHTML = `
      <div class="qr-type-icon">${type.icon}</div>
      <div class="qr-type-name">${type.name}</div>
      <div class="qr-type-desc">${type.description}</div>
    `;
    card.addEventListener('click', () => selectQRType(id));
    grid.appendChild(card);
  });
}

/* ---- Type Selection ---- */

function selectQRType(typeId) {
  const type = QRTypes[typeId];
  if (!type) return;

  AppState.currentType = typeId;
  UI.setActiveType(typeId);
  UI.renderForm(type);
  toggleFileEncoderVisibility(typeId);

  // Bind live preview to new form fields
  bindFormToLivePreview();

  // Clear current QR
  const preview = document.getElementById('qr-preview');
  QRGenerator.clearQR(preview);
  UI.showEmptyState(true);
  AppState.currentPayload = '';

  // Scroll to workspace
  document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- Live Preview ---- */

const debouncedUpdate = debounce(updateQRPreview, 300);

function bindFormToLivePreview() {
  // Bind all form inputs in the form body
  const body = document.getElementById('qr-form-body');
  if (!body) return;

  body.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', debouncedUpdate);
    el.addEventListener('change', debouncedUpdate);
  });
}

function updateQRPreview() {
  const typeConfig = QRTypes[AppState.currentType];
  if (!typeConfig) return;

  const data = UI.collectFormData();
  const payload = typeConfig.buildPayload(data);

  if (!payload) {
    QRGenerator.clearQR(document.getElementById('qr-preview'));
    UI.showEmptyState(true);
    AppState.currentPayload = '';
    resetStats();
    return;
  }

  AppState.currentPayload = payload;
  UI.updatePayloadPreview(payload);

  const preview = document.getElementById('qr-preview');
  UI.showEmptyState(false);

  QRGenerator.generateQR(preview, payload, AppState.currentOptions);

  // Apply logo overlay if present
  if (UI.hasLogo()) applyLogoOverlay();

  // Update stats
  const stats = QRGenerator.getQRStats(payload);
  const contrast = Visualise.checkContrast(AppState.currentOptions.colorDark, AppState.currentOptions.colorLight);
  Visualise.updateDensityMeter(stats.byteSize);
  Visualise.updateScanScore(stats.scanDifficulty, contrast, UI.hasLogo());
  Visualise.updateWarnings(stats.warnings, contrast);
  Visualise.updateContrastWarning(contrast);
}

function resetStats() {
  const label = document.getElementById('stat-payload-size');
  const diff = document.getElementById('stat-scan-difficulty');
  const scoreVal = document.getElementById('scan-score-value');
  const bar = document.getElementById('payload-bar');
  const warnings = document.getElementById('scan-warnings');

  if (label) label.textContent = '—';
  if (diff) diff.textContent = '—';
  if (scoreVal) scoreVal.textContent = '—';
  if (bar) bar.style.width = '0%';
  if (warnings) warnings.innerHTML = '';

  UI.updatePayloadPreview('');
}

/* ---- Logo Overlay ---- */

function onLogoChange(dataURL) {
  if (dataURL && AppState.currentOptions.errorCorrectionLevel !== 'H') {
    AppState.currentOptions.errorCorrectionLevel = 'H';
    const ec = document.getElementById('error-correction');
    if (ec) ec.value = 'H';
    UI.showToast('Switched to High (H) error correction for logo compatibility.', 'warning', 4200);
  }
  if (AppState.currentPayload) updateQRPreview();
}

function applyLogoOverlay() {
  const preview = document.getElementById('qr-preview');
  const canvas = QRGenerator.getCanvas(preview);
  const logoDataURL = UI.getLogoDataURL();
  if (!canvas || !logoDataURL) return;

  const token = ++_logoRenderToken;
  const logo = new Image();
  logo.decoding = 'async';
  logo.onload = () => {
    if (token !== _logoRenderToken) return;

    const ctx = canvas.getContext('2d');
    const logoSizeRatio = Math.max(0.08, Math.min(0.35, Number(AppState.currentOptions.logoSizeRatio || 0.22)));
    const logoSize = canvas.width * logoSizeRatio;
    const padding = Math.max(0, Number(AppState.currentOptions.logoPadding || 6));
    const x = (canvas.width - logoSize) / 2;
    const y = (canvas.height - logoSize) / 2;

    // Draw quiet area under logo for scanning reliability.
    const bgColor = AppState.currentOptions.backgroundTransparent ? '#ffffff' : AppState.currentOptions.colorLight;
    const quietX = x - padding;
    const quietY = y - padding;
    const quietSize = logoSize + padding * 2;
    const quietRadius = AppState.currentOptions.logoShape === 'circle'
      ? quietSize / 2
      : Math.max(0, Number(AppState.currentOptions.logoCornerRadius || 0));

    ctx.save();
    roundedRectPath(ctx, quietX, quietY, quietSize, quietSize, quietRadius);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    const imageRadius = AppState.currentOptions.logoShape === 'circle'
      ? logoSize / 2
      : Math.max(0, Number(AppState.currentOptions.logoCornerRadius || 0));
    roundedRectPath(ctx, x, y, logoSize, logoSize, imageRadius);
    ctx.clip();
    ctx.drawImage(logo, x, y, logoSize, logoSize);
    ctx.restore();
  };
  logo.src = logoDataURL;
}

function roundedRectPath(ctx, x, y, w, h, radius) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ---- Styling Controls ---- */

function bindStylingControls() {
  const fg = document.getElementById('fg-color');
  const bg = document.getElementById('bg-color');
  const finderOuter = document.getElementById('finder-outer-color');
  const finderInner = document.getElementById('finder-inner-color');
  const ec = document.getElementById('error-correction');
  const sz = document.getElementById('qr-size');
  const dotStyle = document.getElementById('dot-style');
  const finderStyle = document.getElementById('finder-style');
  const margin = document.getElementById('qr-margin');
  const marginValue = document.getElementById('margin-value');
  const transparentBg = document.getElementById('transparent-bg');
  const useGradient = document.getElementById('use-gradient');
  const gradientType = document.getElementById('gradient-type');
  const gradientStart = document.getElementById('gradient-start');
  const gradientEnd = document.getElementById('gradient-end');
  const gradientControls = document.getElementById('gradient-controls');

  const logoSize = document.getElementById('logo-size');
  const logoSizeValue = document.getElementById('logo-size-value');
  const logoPadding = document.getElementById('logo-padding');
  const logoPaddingValue = document.getElementById('logo-padding-value');
  const logoShape = document.getElementById('logo-shape');
  const logoCorner = document.getElementById('logo-corner-radius');
  const logoCornerValue = document.getElementById('logo-corner-value');

  function refreshStyleControlState() {
    if (gradientControls) gradientControls.style.display = useGradient?.checked ? 'block' : 'none';
    if (logoSizeValue && logoSize) logoSizeValue.textContent = `${logoSize.value}%`;
    if (logoPaddingValue && logoPadding) logoPaddingValue.textContent = `${logoPadding.value}px`;
    if (logoCornerValue && logoCorner) logoCornerValue.textContent = `${logoCorner.value}px`;
    if (marginValue && margin) marginValue.textContent = margin.value;
  }

  const onStyleChange = debounce(() => {
    AppState.currentOptions.moduleColor = fg?.value || '#000000';
    AppState.currentOptions.colorDark = AppState.currentOptions.moduleColor;
    AppState.currentOptions.colorLight = bg?.value || '#ffffff';
    AppState.currentOptions.finderOuterColor = finderOuter?.value || AppState.currentOptions.moduleColor;
    AppState.currentOptions.finderInnerColor = finderInner?.value || AppState.currentOptions.moduleColor;
    AppState.currentOptions.errorCorrectionLevel = ec?.value || 'M';
    AppState.currentOptions.size = parseInt(sz?.value || '256', 10);
    AppState.currentOptions.dotStyle = dotStyle?.value || 'square';
    AppState.currentOptions.finderStyle = finderStyle?.value || 'square';
    AppState.currentOptions.margin = parseInt(margin?.value || '16', 10);
    AppState.currentOptions.backgroundTransparent = !!transparentBg?.checked;
    AppState.currentOptions.useGradient = !!useGradient?.checked;
    AppState.currentOptions.gradientType = gradientType?.value || 'linear';
    AppState.currentOptions.gradientStart = gradientStart?.value || AppState.currentOptions.colorDark;
    AppState.currentOptions.gradientEnd = gradientEnd?.value || '#2563eb';
    AppState.currentOptions.logoSizeRatio = (parseInt(logoSize?.value || '22', 10) || 22) / 100;
    AppState.currentOptions.logoPadding = parseInt(logoPadding?.value || '6', 10);
    AppState.currentOptions.logoShape = logoShape?.value || 'square';
    AppState.currentOptions.logoCornerRadius = parseInt(logoCorner?.value || '8', 10);

    if (UI.hasLogo() && AppState.currentOptions.errorCorrectionLevel !== 'H') {
      AppState.currentOptions.errorCorrectionLevel = 'H';
      if (ec) ec.value = 'H';
      UI.showToast('Logo mode works best with High (H) error correction. Switched automatically.', 'warning', 4200);
    }

    refreshStyleControlState();

    // Contrast check
    const contrast = Visualise.checkContrast(AppState.currentOptions.colorDark, AppState.currentOptions.colorLight);
    Visualise.updateContrastWarning(contrast);

    if (AppState.currentPayload) updateQRPreview();
  }, 200);

  fg?.addEventListener('input', onStyleChange);
  bg?.addEventListener('input', onStyleChange);
  finderOuter?.addEventListener('input', onStyleChange);
  finderInner?.addEventListener('input', onStyleChange);
  ec?.addEventListener('change', onStyleChange);
  sz?.addEventListener('input', onStyleChange);
  dotStyle?.addEventListener('change', onStyleChange);
  finderStyle?.addEventListener('change', onStyleChange);
  margin?.addEventListener('input', onStyleChange);
  transparentBg?.addEventListener('change', onStyleChange);
  useGradient?.addEventListener('change', onStyleChange);
  gradientType?.addEventListener('change', onStyleChange);
  gradientStart?.addEventListener('input', onStyleChange);
  gradientEnd?.addEventListener('input', onStyleChange);
  logoSize?.addEventListener('input', onStyleChange);
  logoPadding?.addEventListener('input', onStyleChange);
  logoShape?.addEventListener('change', onStyleChange);
  logoCorner?.addEventListener('input', onStyleChange);

  refreshStyleControlState();
}

function toggleFileEncoderVisibility(typeId) {
  const fileCard = document.getElementById('file-encoder-card');
  if (!fileCard) return;
  fileCard.style.display = typeId === 'file' ? 'block' : 'none';
}

function initStylePresets() {
  const wrap = document.getElementById('style-presets');
  if (!wrap) return;

  const presets = getStylePresets();
  wrap.innerHTML = '';

  presets.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'style-preset-card';
    button.dataset.presetId = preset.id;
    button.innerHTML = `
      <canvas width="70" height="70" class="style-preset-preview" aria-hidden="true"></canvas>
      <span class="style-preset-name">${preset.name}</span>
    `;

    button.addEventListener('click', () => {
      applyStylePreset(preset.id);
      setActiveStylePreset(preset.id);
    });

    wrap.appendChild(button);
  });

  renderStylePresetPreviews();
  setActiveStylePreset('classic');
}

function renderStylePresetPreviews() {
  const presets = getStylePresets();
  presets.forEach((preset) => {
    const card = document.querySelector(`.style-preset-card[data-preset-id="${preset.id}"]`);
    const canvas = card?.querySelector('canvas');
    if (!canvas) return;

    const holder = document.createElement('div');
    QRGenerator.generateQR(holder, 'https://qr.studio', {
      size: 70,
      margin: 8,
      moduleColor: preset.options.moduleColor,
      colorDark: preset.options.moduleColor,
      colorLight: preset.options.colorLight,
      finderOuterColor: preset.options.finderOuterColor,
      finderInnerColor: preset.options.finderInnerColor,
      dotStyle: preset.options.dotStyle,
      finderStyle: preset.options.finderStyle,
      useGradient: preset.options.useGradient,
      gradientType: preset.options.gradientType,
      gradientStart: preset.options.gradientStart,
      gradientEnd: preset.options.gradientEnd,
      backgroundTransparent: false
    });

    const generated = holder.querySelector('canvas');
    if (!generated) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(generated, 0, 0, canvas.width, canvas.height);
  });
}

function getStylePresets() {
  return [
    {
      id: 'classic',
      name: 'Classic',
      options: {
        moduleColor: '#111111', colorLight: '#ffffff', finderOuterColor: '#111111', finderInnerColor: '#111111',
        dotStyle: 'square', finderStyle: 'square', margin: 16, useGradient: false, gradientType: 'linear', gradientStart: '#111111', gradientEnd: '#111111'
      }
    },
    {
      id: 'soft-round',
      name: 'Soft Round',
      options: {
        moduleColor: '#0f172a', colorLight: '#f8fafc', finderOuterColor: '#0f172a', finderInnerColor: '#334155',
        dotStyle: 'rounded', finderStyle: 'rounded', margin: 18, useGradient: false, gradientType: 'linear', gradientStart: '#0f172a', gradientEnd: '#0f172a'
      }
    },
    {
      id: 'neo-dots',
      name: 'Neo Dots',
      options: {
        moduleColor: '#1d4ed8', colorLight: '#ffffff', finderOuterColor: '#0f172a', finderInnerColor: '#1d4ed8',
        dotStyle: 'dots', finderStyle: 'circle', margin: 16, useGradient: true, gradientType: 'linear', gradientStart: '#1d4ed8', gradientEnd: '#0ea5e9'
      }
    },
    {
      id: 'sunset',
      name: 'Sunset',
      options: {
        moduleColor: '#be123c', colorLight: '#fff7ed', finderOuterColor: '#9f1239', finderInnerColor: '#f97316',
        dotStyle: 'rounded', finderStyle: 'circle', margin: 16, useGradient: true, gradientType: 'radial', gradientStart: '#f97316', gradientEnd: '#be123c'
      }
    },
    {
      id: 'forest',
      name: 'Forest',
      options: {
        moduleColor: '#166534', colorLight: '#f0fdf4', finderOuterColor: '#14532d', finderInnerColor: '#22c55e',
        dotStyle: 'dots', finderStyle: 'rounded', margin: 18, useGradient: true, gradientType: 'linear', gradientStart: '#22c55e', gradientEnd: '#14532d'
      }
    },
    {
      id: 'mono-tech',
      name: 'Mono Tech',
      options: {
        moduleColor: '#111827', colorLight: '#e5e7eb', finderOuterColor: '#111827', finderInnerColor: '#4b5563',
        dotStyle: 'square', finderStyle: 'rounded', margin: 12, useGradient: false, gradientType: 'linear', gradientStart: '#111827', gradientEnd: '#111827'
      }
    }
  ];
}

function applyStylePreset(presetId) {
  const preset = getStylePresets().find((p) => p.id === presetId);
  if (!preset) return;

  const map = {
    'fg-color': preset.options.moduleColor,
    'bg-color': preset.options.colorLight,
    'finder-outer-color': preset.options.finderOuterColor,
    'finder-inner-color': preset.options.finderInnerColor,
    'dot-style': preset.options.dotStyle,
    'finder-style': preset.options.finderStyle,
    'qr-margin': String(preset.options.margin),
    'use-gradient': preset.options.useGradient,
    'gradient-type': preset.options.gradientType,
    'gradient-start': preset.options.gradientStart,
    'gradient-end': preset.options.gradientEnd
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = value;
  });

  document.getElementById('fg-color')?.dispatchEvent(new Event('input', { bubbles: true }));
  UI.showToast(`Applied style preset: ${preset.name}`, 'success', 2000);
}

function setActiveStylePreset(presetId) {
  document.querySelectorAll('.style-preset-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.presetId === presetId);
  });
}

/* ---- Export Buttons ---- */

function bindExportButtons() {
  const getContainer = () => document.getElementById('qr-preview');
  const getFilename = (ext) => `qr-code-${AppState.currentType}-${Date.now()}.${ext}`;
  const getScale = () => parseInt(document.getElementById('export-scale')?.value || '2', 10);

  document.getElementById('export-svg')?.addEventListener('click', () => QRExport.exportSVG(getContainer(), getFilename('svg')));
  document.getElementById('export-png')?.addEventListener('click', () => QRExport.exportPNG(getContainer(), getFilename('png'), getScale()));
  document.getElementById('export-pdf')?.addEventListener('click', () => QRExport.exportPDF(getContainer(), getFilename('pdf'), true));
  document.getElementById('export-zip')?.addEventListener('click', () => QRExport.exportSingleAsZIP(getContainer(), `qr-code-${AppState.currentType}`));
}

/* ---- File Encoder ---- */

function bindFileEncoder() {
  document.getElementById('encode-file-btn')?.addEventListener('click', async () => {
    const fileInput = document.getElementById('file-input');
    if (!fileInput?.files[0]) { UI.showToast('Please select a file first.', 'warning'); return; }

    try {
      const result = await FileEncoder.encodeFile(fileInput.files[0]);
      showFileStats(result);
      generateFromPayload(result.payload);
      UI.showToast('File encoded to QR!', 'success');
    } catch (err) {
      UI.showToast(`File encoding failed: ${err.message}`, 'error');
    }
  });

  document.getElementById('encode-text-btn')?.addEventListener('click', () => {
    const text = document.getElementById('file-text-input')?.value;
    if (!text) { UI.showToast('Please enter some text first.', 'warning'); return; }

    const result = FileEncoder.encodeText(text, 'snippet.txt');
    showFileStats(result);
    generateFromPayload(result.payload);
    UI.showToast('Text encoded to QR!', 'success');
  });
}

function showFileStats(result) {
  const statsBox = document.getElementById('file-stats');
  if (!statsBox) return;
  statsBox.style.display = 'block';
  document.getElementById('file-size').textContent = `${result.byteSize} bytes`;
  document.getElementById('encoded-size').textContent = `${result.encodedSize} bytes`;
  document.getElementById('file-density').textContent = result.density;

  result.warnings?.forEach(w => UI.showToast(w, 'warning', 5000));
}

function generateFromPayload(payload) {
  AppState.currentPayload = payload;
  UI.updatePayloadPreview(payload);

  const preview = document.getElementById('qr-preview');
  UI.showEmptyState(false);
  QRGenerator.generateQR(preview, payload, AppState.currentOptions);
  if (UI.hasLogo()) applyLogoOverlay();

  const stats = QRGenerator.getQRStats(payload);
  const contrast = Visualise.checkContrast(AppState.currentOptions.colorDark, AppState.currentOptions.colorLight);
  Visualise.updateDensityMeter(stats.byteSize);
  Visualise.updateScanScore(stats.scanDifficulty, contrast, UI.hasLogo());
  Visualise.updateWarnings(stats.warnings, contrast);
}

/* ---- Copy Payload ---- */

function copyPayload() {
  if (!AppState.currentPayload) { UI.showToast('No payload to copy.', 'warning'); return; }
  navigator.clipboard.writeText(AppState.currentPayload).then(() => {
    UI.showToast('Payload copied to clipboard!', 'success');
  }).catch(() => {
    // Legacy fallback for browsers without clipboard API (document.execCommand is deprecated but kept for compatibility)
    const el = document.createElement('textarea');
    el.value = AppState.currentPayload;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    UI.showToast('Payload copied!', 'success');
  });
}

