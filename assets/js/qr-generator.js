/* ============================================================
   qr-generator.js — Core QR Code Generation Module
   ============================================================ */

const QR_MAX_BYTES = 2953; // Maximum QR binary capacity (error correction L)
window.QR_MAX_BYTES = QR_MAX_BYTES;

const QRGenerator = (() => {

  let _currentQRInstance = null;

  /**
   * Map string level to QRCode.CorrectLevel constant
   */
  function _getCorrectLevel(level) {
    const levels = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
    return levels[level] || QRCode.CorrectLevel.M;
  }

  /**
   * Generate a QR code into the given DOM container element.
   * @param {HTMLElement} container - DOM element to render into
   * @param {string} text - Payload string
   * @param {object} options - { errorCorrectionLevel, size, colorDark, colorLight }
   */
  function generateQR(container, text, options = {}) {
    if (!container) return null;
    if (!text || !text.trim()) {
      clearQR(container);
      return null;
    }

    const size = options.size || 256;
    const colorDark = options.colorDark || '#000000';
    const colorLight = options.colorLight || '#ffffff';
    const level = options.errorCorrectionLevel || 'M';

    // Clear existing
    container.innerHTML = '';

    try {
      _currentQRInstance = new QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: _getCorrectLevel(level)
      });

      // Ensure canvas/img are styled correctly
      const canvas = container.querySelector('canvas');
      const img = container.querySelector('img');
      if (canvas) {
        canvas.style.borderRadius = '4px';
        canvas.style.display = 'block';
      }
      if (img) {
        img.style.borderRadius = '4px';
        img.style.display = 'block';
      }

      return _currentQRInstance;
    } catch (err) {
      console.error('QR generation failed:', err);
      container.innerHTML = `<div style="color:#dc2626;font-size:0.85rem;padding:1rem;text-align:center;">
        ⚠️ Could not generate QR code.<br><small>${err.message}</small>
      </div>`;
      return null;
    }
  }

  /**
   * Generate a QR code and return it, for use in multi-part or file export.
   * Returns the container element after generation.
   */
  function generateQRToElement(text, options = {}) {
    const container = document.createElement('div');
    generateQR(container, text, options);
    return container;
  }

  /**
   * Get QR stats for analysis panel.
   * @param {string} text
   * @returns {{ byteSize, chars, density, scanDifficulty, warnings }}
   */
  function getQRStats(text) {
    if (!text) return { byteSize: 0, chars: 0, density: 'Empty', scanDifficulty: '—', warnings: [] };

    const byteSize = new TextEncoder().encode(text).length;
    const chars = text.length;
    const warnings = [];
    let scanDifficulty, densityPct;

    if (chars < 100) {
      scanDifficulty = 'Easy';
      densityPct = Math.round((chars / 100) * 25);
    } else if (chars < 300) {
      scanDifficulty = 'Medium';
      densityPct = 25 + Math.round(((chars - 100) / 200) * 25);
    } else if (chars < 700) {
      scanDifficulty = 'Hard';
      densityPct = 50 + Math.round(((chars - 300) / 400) * 25);
    } else {
      scanDifficulty = 'Very Hard';
      densityPct = Math.min(100, 75 + Math.round(((chars - 700) / 1000) * 25));
    }

    if (chars > 500) warnings.push('Large payload — QR may be dense and harder to scan.');
    if (chars > 900) warnings.push('Very large payload — consider Multi-Part QR mode.');
    if (byteSize > QR_MAX_BYTES) warnings.push(`Payload exceeds QR binary capacity (${QR_MAX_BYTES} bytes).`);

    return { byteSize, chars, density: scanDifficulty, scanDifficulty, densityPct, warnings };
  }

  /**
   * Clear a QR code container.
   */
  function clearQR(container) {
    if (!container) return;
    container.innerHTML = '';
    _currentQRInstance = null;
  }

  /**
   * Get the canvas element from a QR container.
   */
  function getCanvas(container) {
    if (!container) return null;
    return container.querySelector('canvas');
  }

  /**
   * Get the image element from a QR container.
   */
  function getImage(container) {
    if (!container) return null;
    return container.querySelector('img');
  }

  return { generateQR, generateQRToElement, getQRStats, clearQR, getCanvas, getImage };

})();

window.QRGenerator = QRGenerator;
