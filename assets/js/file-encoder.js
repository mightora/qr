/* ============================================================
   file-encoder.js — File Encoding Module
   ============================================================ */

const FileEncoder = (() => {

  /**
   * Read and encode a File object.
   * Text files are stored as-is; binary files are base64 encoded.
   * @param {File} file
   * @returns {Promise<{ payload, byteSize, encodedSize, density, warnings }>}
   */
  function encodeFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const isText = _isTextFile(file.name);

      reader.onload = (e) => {
        try {
          let content, encoding;
          if (isText) {
            content = e.target.result;
            encoding = 'utf8';
          } else {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(e.target.result);
            content = _bytesToBase64(bytes);
            encoding = 'base64';
          }

          const payload = JSON.stringify({
            type: 'file',
            name: file.name,
            encoding: encoding,
            data: content
          });

          resolve(_buildStats(file.size, payload));
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Encode a plain text string (user pasted text).
   * @param {string} text
   * @param {string} filename
   * @returns {{ payload, byteSize, encodedSize, density, warnings }}
   */
  function encodeText(text, filename) {
    filename = filename || 'snippet.txt';
    const payload = JSON.stringify({
      type: 'file',
      name: filename,
      encoding: 'utf8',
      data: text
    });
    const byteSize = new TextEncoder().encode(text).length;
    return _buildStats(byteSize, payload);
  }

  /**
   * Decode an encoded QR payload back to its content.
   * @param {string} encoded - JSON string
   * @returns {{ name, encoding, data, text }}
   */
  function decodeFile(encoded) {
    try {
      const obj = JSON.parse(encoded);
      if (obj.type !== 'file') return null;
      let text = obj.data;
      if (obj.encoding === 'base64') {
        const bytes = _base64ToBytes(obj.data);
        text = `[Binary file: ${obj.name} — ${bytes.length} bytes]`;
      }
      return { name: obj.name, encoding: obj.encoding, data: obj.data, text };
    } catch {
      return null;
    }
  }

  /* ---- helpers ---- */

  function _isTextFile(name) {
    return /\.(txt|json|csv|xml|md|html|htm|css|js|yaml|yml|ini|cfg|log)$/i.test(name);
  }

  function _bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function _base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function _buildStats(originalBytes, payload) {
    const encodedSize = new TextEncoder().encode(payload).length;
    const warnings = [];
    let density;

    if (encodedSize < 200) density = 'Low';
    else if (encodedSize < 500) density = 'Medium';
    else if (encodedSize < 900) density = 'High';
    else { density = 'Very High'; warnings.push('Payload is very large. Consider Multi-Part QR mode.'); }

    if (encodedSize > 2953) warnings.push('⚠️ Payload exceeds maximum QR capacity. Use Multi-Part QR.');

    return { payload, byteSize: originalBytes, encodedSize, density, warnings };
  }

  return { encodeFile, encodeText, decodeFile };

})();

window.FileEncoder = FileEncoder;
