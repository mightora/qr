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
    colorDark: '#000000',
    colorLight: '#ffffff'
  },
  multipartContainers: []
};
window.AppState = AppState;

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
    UI.initChunkSizeRange();
    UI.initLogoUpload(onLogoChange);

    // Select default type
    selectQRType('url');

    // Bind styling controls
    bindStylingControls();

    // Bind export buttons
    bindExportButtons();

    // Bind file encoder
    bindFileEncoder();

    // Bind multi-part
    bindMultipart();

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
  if (AppState.currentPayload) updateQRPreview();
}

function applyLogoOverlay() {
  const preview = document.getElementById('qr-preview');
  const canvas = preview?.querySelector('canvas');
  if (!canvas || !UI.getLogoDataURL()) return;

  const ctx = canvas.getContext('2d');
  const logo = new Image();
  logo.onload = () => {
    const logoSize = canvas.width * 0.22;
    const x = (canvas.width - logoSize) / 2;
    const y = (canvas.height - logoSize) / 2;

    // White padding behind logo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);
    ctx.drawImage(logo, x, y, logoSize, logoSize);
  };
  logo.src = UI.getLogoDataURL();
}

/* ---- Styling Controls ---- */

function bindStylingControls() {
  const fg = document.getElementById('fg-color');
  const bg = document.getElementById('bg-color');
  const ec = document.getElementById('error-correction');
  const sz = document.getElementById('qr-size');

  const onStyleChange = debounce(() => {
    AppState.currentOptions.colorDark = fg?.value || '#000000';
    AppState.currentOptions.colorLight = bg?.value || '#ffffff';
    AppState.currentOptions.errorCorrectionLevel = ec?.value || 'M';
    AppState.currentOptions.size = parseInt(sz?.value || '256', 10);

    // Contrast check
    const contrast = Visualise.checkContrast(AppState.currentOptions.colorDark, AppState.currentOptions.colorLight);
    Visualise.updateContrastWarning(contrast);

    if (AppState.currentPayload) updateQRPreview();
  }, 200);

  fg?.addEventListener('input', onStyleChange);
  bg?.addEventListener('input', onStyleChange);
  ec?.addEventListener('change', onStyleChange);
  sz?.addEventListener('input', onStyleChange);
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

  // Multi-part export buttons
  document.getElementById('export-multipart-pdf')?.addEventListener('click', exportMultipartPDF);
  document.getElementById('export-multipart-zip')?.addEventListener('click', exportMultipartZIP);
}

async function exportMultipartPDF() {
  if (!AppState.multipartContainers.length) { UI.showToast('Generate multi-part QR codes first!', 'warning'); return; }
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let x = 20, y = 20;
    const qrSize = 80;

    pdf.setFontSize(16);
    pdf.setTextColor(30, 30, 30);
    pdf.text(`QR Studio — Multi-Part Set (${AppState.multipartContainers.length} parts)`, 105, 15, { align: 'center' });
    y = 25;

    AppState.multipartContainers.forEach((wrapper, i) => {
      const canvas = wrapper.querySelector('canvas');
      if (!canvas) return;
      if (i > 0 && i % 4 === 0) { pdf.addPage(); x = 20; y = 20; }
      else if (i > 0) { x += qrSize + 15; if (x + qrSize > 200) { x = 20; y += qrSize + 20; } }

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Part ${i + 1} of ${AppState.multipartContainers.length}`, x + qrSize / 2, y + qrSize + 5, { align: 'center' });
    });

    pdf.save(`qr-multipart-${Date.now()}.pdf`);
    UI.showToast('Multi-part PDF exported!', 'success');
  } catch (err) {
    console.error(err);
    UI.showToast('PDF export failed.', 'error');
  }
}

function exportMultipartZIP() {
  if (!AppState.multipartContainers.length) { UI.showToast('Generate multi-part QR codes first!', 'warning'); return; }
  QRExport.exportZIP(AppState.multipartContainers, `qr-multipart-${Date.now()}.zip`);
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

  const stats = QRGenerator.getQRStats(payload);
  const contrast = Visualise.checkContrast(AppState.currentOptions.colorDark, AppState.currentOptions.colorLight);
  Visualise.updateDensityMeter(stats.byteSize);
  Visualise.updateScanScore(stats.scanDifficulty, contrast, UI.hasLogo());
  Visualise.updateWarnings(stats.warnings, contrast);
}

/* ---- Multi-Part QR ---- */

function bindMultipart() {
  document.getElementById('generate-multipart-btn')?.addEventListener('click', () => {
    const payload = AppState.currentPayload;
    if (!payload) { UI.showToast('Generate a QR code first to split it.', 'warning'); return; }

    const chunkSize = parseInt(document.getElementById('chunk-size')?.value || '500', 10);
    const container = document.getElementById('multipart-preview');
    if (!container) return;

    container.style.display = 'grid';
    AppState.multipartContainers = [];

    const wrappers = MultipartQR.generateMultipartQRs(container, payload, {
      ...AppState.currentOptions,
      chunkSize,
      size: 160
    });

    AppState.multipartContainers = wrappers;
    UI.showMultipartExport(wrappers.length > 0);
    UI.showToast(`Generated ${wrappers.length} QR codes!`, 'success');
  });
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

