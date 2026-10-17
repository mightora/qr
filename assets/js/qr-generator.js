/* ============================================================
   qr-generator.js — Core QR Code Generation Module
   ============================================================ */

const QR_MAX_BYTES = 2953; // Maximum QR binary capacity (error correction L)
window.QR_MAX_BYTES = QR_MAX_BYTES;

const QRGenerator = (() => {

  let _currentQRInstance = null;
  let _currentMatrix = null;

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
    const margin = Math.max(0, Number(options.margin ?? 16));

    // Clear existing
    container.innerHTML = '';

    try {
      const temp = document.createElement('div');
      _currentQRInstance = new QRCode(temp, {
        text: text,
        width: size,
        height: size,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: _getCorrectLevel(level)
      });

      _currentMatrix = _currentQRInstance?._oQRCode || null;
      if (!_currentMatrix || typeof _currentMatrix.getModuleCount !== 'function') {
        throw new Error('Unable to read QR matrix from generator');
      }

      const canvas = _renderStyledCanvas(_currentMatrix, {
        size,
        margin,
        colorDark,
        colorLight,
        moduleColor: options.moduleColor || colorDark,
        finderOuterColor: options.finderOuterColor || colorDark,
        finderInnerColor: options.finderInnerColor || colorDark,
        dotStyle: options.dotStyle || 'square',
        finderStyle: options.finderStyle || 'square',
        useGradient: !!options.useGradient,
        gradientType: options.gradientType || 'linear',
        gradientStart: options.gradientStart || colorDark,
        gradientEnd: options.gradientEnd || '#2563eb',
        backgroundTransparent: !!options.backgroundTransparent
      });

      container.appendChild(canvas);

      if (canvas) {
        canvas.style.borderRadius = '4px';
        canvas.style.display = 'block';
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
    if (chars > 900) warnings.push('Very large payload — consider shortening content or linking to hosted data.');
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
    _currentMatrix = null;
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

  function _renderStyledCanvas(matrix, options) {
    const size = options.size;
    const margin = options.margin;
    const moduleColor = options.moduleColor;
    const colorLight = options.colorLight;
    const n = matrix.getModuleCount();
    const cell = (size - margin * 2) / n;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    if (!options.backgroundTransparent) {
      ctx.fillStyle = colorLight;
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0, 0, size, size);
    }

    const darkPaint = _getDarkPaint(ctx, size, options);
    const drawCell = _getCellDrawer(options.dotStyle);

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (!matrix.isDark(row, col)) continue;
        if (_isFinderCell(row, col, n)) continue;

        const x = margin + col * cell;
        const y = margin + row * cell;
        drawCell(ctx, x, y, cell, darkPaint);
      }
    }

    _drawFinders(ctx, n, cell, margin, {
      finderStyle: options.finderStyle,
      finderOuterPaint: options.finderOuterColor || moduleColor,
      finderInnerPaint: options.finderInnerColor || moduleColor,
      colorLight,
      backgroundTransparent: options.backgroundTransparent
    });

    return canvas;
  }

  function _getDarkPaint(ctx, size, options) {
    if (!options.useGradient) return options.moduleColor;

    let gradient;
    if (options.gradientType === 'radial') {
      gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.6);
    } else {
      gradient = ctx.createLinearGradient(0, 0, size, size);
    }
    gradient.addColorStop(0, options.gradientStart || options.moduleColor);
    gradient.addColorStop(1, options.gradientEnd || options.moduleColor);
    return gradient;
  }

  function _getCellDrawer(style) {
    if (style === 'dots') {
      return (ctx, x, y, cell, paint) => {
        ctx.fillStyle = paint;
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.42, 0, Math.PI * 2);
        ctx.fill();
      };
    }

    if (style === 'rounded') {
      return (ctx, x, y, cell, paint) => {
        ctx.fillStyle = paint;
        _pathRoundRect(ctx, x, y, cell, cell, Math.max(1, cell * 0.3));
        ctx.fill();
      };
    }

    return (ctx, x, y, cell, paint) => {
      ctx.fillStyle = paint;
      ctx.fillRect(x, y, cell, cell);
    };
  }

  function _drawFinders(ctx, count, cell, margin, options) {
    const anchors = [
      { row: 0, col: 0 },
      { row: 0, col: count - 7 },
      { row: count - 7, col: 0 }
    ];

    anchors.forEach(({ row, col }) => {
      const x = margin + col * cell;
      const y = margin + row * cell;
      const size7 = cell * 7;
      const size5 = cell * 5;
      const size3 = cell * 3;

      if (options.finderStyle === 'circle') {
        const cx = x + size7 / 2;
        const cy = y + size7 / 2;
        _fillCircle(ctx, cx, cy, size7 * 0.5, options.finderOuterPaint);
        _fillLightCircle(ctx, cx, cy, size5 * 0.5, options.colorLight, options.backgroundTransparent);
        _fillCircle(ctx, cx, cy, size3 * 0.5, options.finderInnerPaint);
        return;
      }

      if (options.finderStyle === 'rounded') {
        const radiusOuter = Math.max(2, cell * 1.6);
        const radiusMid = Math.max(2, cell * 1.2);
        const radiusInner = Math.max(1, cell * 0.8);

        _fillRoundRect(ctx, x, y, size7, size7, radiusOuter, options.finderOuterPaint);
        _fillLightRoundRect(ctx, x + cell, y + cell, size5, size5, radiusMid, options.colorLight, options.backgroundTransparent);
        _fillRoundRect(ctx, x + 2 * cell, y + 2 * cell, size3, size3, radiusInner, options.finderInnerPaint);
        return;
      }

      _fillRect(ctx, x, y, size7, size7, options.finderOuterPaint);
      _fillLightRect(ctx, x + cell, y + cell, size5, size5, options.colorLight, options.backgroundTransparent);
      _fillRect(ctx, x + 2 * cell, y + 2 * cell, size3, size3, options.finderInnerPaint);
    });
  }

  function _isFinderCell(row, col, count) {
    const topLeft = row < 7 && col < 7;
    const topRight = row < 7 && col >= count - 7;
    const bottomLeft = row >= count - 7 && col < 7;
    return topLeft || topRight || bottomLeft;
  }

  function _fillRect(ctx, x, y, w, h, paint) {
    ctx.fillStyle = paint;
    ctx.fillRect(x, y, w, h);
  }

  function _fillLightRect(ctx, x, y, w, h, colorLight, transparent) {
    if (transparent) {
      ctx.clearRect(x, y, w, h);
      return;
    }
    ctx.fillStyle = colorLight;
    ctx.fillRect(x, y, w, h);
  }

  function _fillRoundRect(ctx, x, y, w, h, radius, paint) {
    ctx.fillStyle = paint;
    _pathRoundRect(ctx, x, y, w, h, radius);
    ctx.fill();
  }

  function _fillLightRoundRect(ctx, x, y, w, h, radius, colorLight, transparent) {
    if (transparent) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      _pathRoundRect(ctx, x, y, w, h, radius);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = colorLight;
    _pathRoundRect(ctx, x, y, w, h, radius);
    ctx.fill();
  }

  function _fillCircle(ctx, cx, cy, r, paint) {
    ctx.fillStyle = paint;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function _fillLightCircle(ctx, cx, cy, r, colorLight, transparent) {
    if (transparent) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.fillStyle = colorLight;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function _pathRoundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  return { generateQR, generateQRToElement, getQRStats, clearQR, getCanvas, getImage };

})();

window.QRGenerator = QRGenerator;
