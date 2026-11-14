/* ============================================================
   visualise.js — Visualisation & Analysis Module
   ============================================================ */

const Visualise = (() => {

  /**
   * Update the density/payload bar in the stats card.
   * @param {number} payloadSize - byte size of payload
   */
  function updateDensityMeter(payloadSize) {
    const bar = document.getElementById('payload-bar');
    const label = document.getElementById('stat-payload-size');
    if (!bar || !label) return;

    const maxCapacity = window.QR_MAX_BYTES || 2953;
    const pct = Math.min(100, Math.round((payloadSize / maxCapacity) * 100));

    bar.style.width = pct + '%';

    // Color gradient based on usage
    if (pct < 30) bar.style.background = 'linear-gradient(90deg, #16a34a, #22c55e)';
    else if (pct < 60) bar.style.background = 'linear-gradient(90deg, #22c55e, #d97706)';
    else if (pct < 85) bar.style.background = 'linear-gradient(90deg, #d97706, #ef4444)';
    else bar.style.background = 'linear-gradient(90deg, #ef4444, #991b1b)';

    if (payloadSize < 1024) {
      label.textContent = `${payloadSize} B`;
    } else {
      label.textContent = `${(payloadSize / 1024).toFixed(1)} KB`;
    }
  }

  /**
   * Update scan difficulty label and score ring.
   * @param {string} difficulty - 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
   * @param {number} contrastRatio - numeric contrast ratio
   * @param {boolean} hasLogo - whether a logo is overlaid
   */
  function updateScanScore(difficulty, contrastRatio, hasLogo) {
    const label = document.getElementById('stat-scan-difficulty');
    const scoreEl = document.getElementById('scan-score-display');
    const scoreVal = document.getElementById('scan-score-value');

    if (!label || !scoreEl || !scoreVal) return;

    let score = 100;

    // Deduct for difficulty
    const diffPenalties = { 'Easy': 0, 'Medium': 15, 'Hard': 35, 'Very Hard': 55 };
    score -= (diffPenalties[difficulty] || 0);

    // Deduct for contrast
    if (contrastRatio < 4.5) score -= 20;
    else if (contrastRatio < 7) score -= 5;

    // Deduct for logo
    if (hasLogo) score -= 10;

    score = Math.max(0, Math.min(100, score));

    label.textContent = difficulty;
    scoreVal.textContent = score;

    // Remove existing score classes
    scoreEl.classList.remove('score-easy', 'score-medium', 'score-hard');
    if (score >= 70) scoreEl.classList.add('score-easy');
    else if (score >= 45) scoreEl.classList.add('score-medium');
    else scoreEl.classList.add('score-hard');

    // Update conic gradient ring
    const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
    scoreEl.style.background = `conic-gradient(${color} ${score}%, var(--bg-tertiary) ${score}%)`;
  }

  /**
   * Check contrast ratio between two hex colors.
   * Returns WCAG contrast ratio.
   * @param {string} fg - hex color
   * @param {string} bg - hex color
   * @returns {number} contrast ratio
   */
  function checkContrast(fg, bg) {
    const fgL = _relativeLuminance(_hexToRGB(fg));
    const bgL = _relativeLuminance(_hexToRGB(bg));
    const lighter = Math.max(fgL, bgL);
    const darker = Math.min(fgL, bgL);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Update warnings list in the stats card.
   * @param {Array<string>} warnings
   * @param {number} contrastRatio
   */
  function updateWarnings(warnings, contrastRatio) {
    const list = document.getElementById('scan-warnings');
    if (!list) return;
    list.innerHTML = '';

    const allWarnings = [...(warnings || [])];
    if (contrastRatio < 4.5) allWarnings.unshift(`⚠️ Low contrast (${contrastRatio.toFixed(1)}:1) — minimum recommended is 4.5:1`);

    allWarnings.forEach(w => {
      const el = document.createElement('div');
      el.className = 'warning-item' + (w.includes('⚠️') ? '' : '');
      el.textContent = w;
      list.appendChild(el);
    });
  }

  /**
   * Update the payload size indicator with color coding.
   * @param {number} size - bytes
   */
  function updatePayloadIndicator(size) {
    updateDensityMeter(size);
  }

  /**
   * Show/update a contrast warning in the styling panel.
   * @param {number} ratio
   */
  function updateContrastWarning(ratio) {
    const warn = document.getElementById('contrast-warning');
    if (!warn) return;
    if (ratio < 4.5) {
      warn.style.display = 'block';
      warn.textContent = `⚠️ Low contrast (${ratio.toFixed(1)}:1). Recommended minimum is 4.5:1. This may affect scannability.`;
    } else {
      warn.style.display = 'none';
    }
  }

  /* ---- colour helpers ---- */

  function _hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  function _relativeLuminance({ r, g, b }) {
    const toLinear = c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  return { updateDensityMeter, updateScanScore, checkContrast, updateWarnings, updatePayloadIndicator, updateContrastWarning };

})();

window.Visualise = Visualise;
