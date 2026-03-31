/* ============================================================
   multipart.js — Multi-Part QR Splitting Module
   ============================================================ */

const MultipartQR = (() => {

  /**
   * Split a large payload into chunks with metadata headers.
   * @param {string} text - The full payload
   * @param {number} chunkSize - Characters per chunk (default 500)
   * @returns {Array<string>} Array of chunk strings with headers
   */
  function splitPayload(text, chunkSize = 500) {
    if (!text) return [];

    const checksum = _simpleChecksum(text);
    const chunks = [];

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    const total = chunks.length;
    return chunks.map((chunk, idx) => `[QR:${idx + 1}/${total}:${checksum}]${chunk}`);
  }

  /**
   * Generate multiple QR codes (one per chunk) into a container.
   * @param {HTMLElement} container - The grid container to render into
   * @param {string} text - Full payload
   * @param {object} options - QR generation options
   * @returns {Array<HTMLElement>} Array of QR wrapper elements
   */
  function generateMultipartQRs(container, text, options = {}) {
    if (!container || !text) return [];

    const chunkSize = options.chunkSize || 500;
    const parts = splitPayload(text, chunkSize);
    container.innerHTML = '';

    const wrappers = parts.map((part, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'multipart-qr-item';
      wrapper.dataset.partIndex = idx;

      const label = document.createElement('div');
      label.className = 'part-label';
      label.textContent = `Part ${idx + 1} of ${parts.length}`;

      const qrHolder = document.createElement('div');
      qrHolder.className = 'part-qr-holder';

      wrapper.appendChild(label);
      wrapper.appendChild(qrHolder);
      container.appendChild(wrapper);

      // Render QR inside the holder (smaller size for grid display)
      QRGenerator.generateQR(qrHolder, part, { ...options, size: options.size || 160 });

      return wrapper;
    });

    // Append sequence visualization
    const viz = _buildSequenceViz(parts.length);
    container.appendChild(viz);

    return wrappers;
  }

  /**
   * Build a simple visual sequence indicator.
   */
  function _buildSequenceViz(total) {
    const wrap = document.createElement('div');
    wrap.className = 'sequence-viz';
    wrap.style.cssText = 'grid-column:1/-1;display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;padding:0.5rem 0;';

    const label = document.createElement('span');
    label.style.cssText = 'font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-right:0.25rem;';
    label.textContent = 'Sequence:';
    wrap.appendChild(label);

    for (let i = 1; i <= total; i++) {
      const dot = document.createElement('span');
      dot.style.cssText = `
        display:inline-flex;align-items:center;justify-content:center;
        width:28px;height:28px;border-radius:50%;
        background:var(--primary);color:white;
        font-size:0.7rem;font-weight:700;
      `;
      dot.textContent = i;
      wrap.appendChild(dot);

      if (i < total) {
        const arrow = document.createElement('span');
        arrow.style.cssText = 'font-size:0.7rem;color:var(--text-muted);';
        arrow.textContent = '→';
        wrap.appendChild(arrow);
      }
    }

    return wrap;
  }

  const CHECKSUM_SAMPLE_LENGTH = 500; // chars sampled for checksum (performance vs accuracy)

  /**
   * Simple checksum: sum of char codes mod 65536 as hex.
   */
  function _simpleChecksum(text) {
    let sum = 0;
    for (let i = 0; i < Math.min(text.length, CHECKSUM_SAMPLE_LENGTH); i++) sum = (sum + text.charCodeAt(i)) & 0xffff;
    return sum.toString(16).padStart(4, '0');
  }

  return { splitPayload, generateMultipartQRs };

})();

window.MultipartQR = MultipartQR;
