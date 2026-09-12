/* ============================================================
   ui.js — UI State Management
   ============================================================ */

const UI = (() => {

  let _zoomLevel = 1;
  let _hasLogo = false;
  let _logoDataURL = null;

  /* ---- Toast Notifications ---- */

  function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  /* ---- Collapsible Panels ---- */

  function initCollapsibles() {
    document.querySelectorAll('.card-header.collapsible').forEach(header => {
      const targetId = header.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) return;

      // Start collapsed
      target.style.display = 'none';
      header.classList.add('collapsed');

      header.addEventListener('click', () => {
        const isCollapsed = header.classList.contains('collapsed');
        if (isCollapsed) {
          target.style.display = 'block';
          header.classList.remove('collapsed');
        } else {
          target.style.display = 'none';
          header.classList.add('collapsed');
        }
      });
    });
  }

  /* ---- Accordion ---- */

  function initAccordion() {
    document.querySelectorAll('.accordion-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const isOpen = content.classList.contains('open');

        // Close all
        document.querySelectorAll('.accordion-content.open').forEach(c => c.classList.remove('open'));
        document.querySelectorAll('.accordion-trigger.open').forEach(b => b.classList.remove('open'));

        if (!isOpen) {
          content.classList.add('open');
          btn.classList.add('open');
        }
      });
    });
  }

  /* ---- QR Type Selection ---- */

  function setActiveType(typeId) {
    document.querySelectorAll('.qr-type-card').forEach(card => {
      card.classList.toggle('active', card.dataset.typeId === typeId);
    });
  }

  /* ---- Form Rendering ---- */

  function renderForm(typeConfig) {
    const body = document.getElementById('qr-form-body');
    const title = document.getElementById('form-type-title');
    const desc = document.getElementById('form-type-desc');
    const plainBox = document.getElementById('plain-english-box');
    const plainText = document.getElementById('plain-english-text');
    if (!body || !typeConfig) return;

    title.textContent = `${typeConfig.icon} ${typeConfig.name}`;
    desc.textContent = typeConfig.description;
    body.innerHTML = '';

    typeConfig.fields.forEach(field => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.className = 'form-label';
      label.textContent = field.label + (field.required ? ' *' : '');
      label.setAttribute('for', `field-${field.id}`);

      let input;

      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.className = 'form-textarea';
        input.placeholder = field.placeholder || '';
        input.rows = 4;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        input.className = 'form-select';
        (field.options || []).forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
      } else if (field.type === 'checkbox') {
        const row = document.createElement('div');
        row.className = 'form-checkbox-row';
        input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'form-checkbox';
        input.id = `field-${field.id}`;
        input.dataset.fieldId = field.id;
        const chkLabel = document.createElement('label');
        chkLabel.textContent = field.label;
        chkLabel.setAttribute('for', `field-${field.id}`);
        chkLabel.className = 'form-label';
        chkLabel.style.marginBottom = '0';
        row.appendChild(input);
        row.appendChild(chkLabel);
        group.appendChild(row);
        body.appendChild(group);
        return;
      } else if (field.type === 'password' && field.passwordToggle) {
        const wrap = document.createElement('div');
        wrap.className = 'password-field';
        input = document.createElement('input');
        input.type = 'password';
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
        input.id = `field-${field.id}`;
        input.dataset.fieldId = field.id;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.textContent = 'Show';
        toggle.addEventListener('click', () => {
          input.type = input.type === 'password' ? 'text' : 'password';
          toggle.textContent = input.type === 'password' ? 'Show' : 'Hide';
        });

        wrap.appendChild(input);
        wrap.appendChild(toggle);
        group.appendChild(label);
        group.appendChild(wrap);
        body.appendChild(group);
        return;
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
        input.className = 'form-input';
        input.placeholder = field.placeholder || '';
        if (field.required) input.required = true;
      }

      input.id = `field-${field.id}`;
      input.dataset.fieldId = field.id;

      group.appendChild(label);
      group.appendChild(input);
      body.appendChild(group);
    });

    // Copy payload row
    const copyRow = document.createElement('div');
    copyRow.className = 'copy-payload-row';
    copyRow.innerHTML = `
      <span class="payload-preview" id="payload-preview-text">—</span>
      <button class="btn btn--secondary" id="copy-payload-btn" style="font-size:0.78rem;padding:0.35rem 0.75rem;">📋 Copy</button>
    `;
    body.appendChild(copyRow);

    // Show plain English
    if (plainBox && plainText && typeConfig.plainEnglish) {
      plainBox.style.display = 'block';
      plainText.textContent = typeConfig.plainEnglish;
    }
  }

  /* ---- Collect Form Data ---- */

  function collectFormData() {
    const data = {};
    document.querySelectorAll('[data-field-id]').forEach(el => {
      const key = el.dataset.fieldId;
      if (el.type === 'checkbox') data[key] = el.checked;
      else data[key] = el.value;
    });
    return data;
  }

  /* ---- Preview Controls ---- */

  function initPreviewControls() {
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      _zoomLevel = Math.min(3, _zoomLevel + 0.25);
      _applyZoom();
    });

    document.getElementById('zoom-out')?.addEventListener('click', () => {
      _zoomLevel = Math.max(0.25, _zoomLevel - 0.25);
      _applyZoom();
    });

    document.getElementById('toggle-grid')?.addEventListener('click', function () {
      const container = document.getElementById('preview-container');
      container?.classList.toggle('grid-overlay');
      this.classList.toggle('active');
    });
  }

  function _applyZoom() {
    const display = document.getElementById('qr-preview');
    if (display) display.style.transform = `scale(${_zoomLevel})`;
  }

  /* ---- Logo Upload ---- */

  function initLogoUpload(onLogoChange) {
    document.getElementById('logo-upload')?.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) { _hasLogo = false; _logoDataURL = null; onLogoChange && onLogoChange(null); return; }

      const reader = new FileReader();
      reader.onload = (ev) => {
        _hasLogo = true;
        _logoDataURL = ev.target.result;
        onLogoChange && onLogoChange(_logoDataURL);
        showToast('Logo loaded. Regenerating QR...', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  function getLogoDataURL() { return _logoDataURL; }
  function hasLogo() { return _hasLogo; }

  /* ---- QR Empty State Toggle ---- */

  function showEmptyState(show) {
    const empty = document.getElementById('qr-empty-state');
    const preview = document.getElementById('qr-preview');
    if (empty) empty.style.display = show ? 'block' : 'none';
    if (preview) preview.style.display = show ? 'none' : 'flex';
  }

  /* ---- Size range display ---- */

  function initSizeRange() {
    const range = document.getElementById('qr-size');
    const display = document.getElementById('size-value');
    if (range && display) {
      range.addEventListener('input', () => { display.textContent = range.value; });
    }
  }

  function initChunkSizeRange() {
    const range = document.getElementById('chunk-size');
    const display = document.getElementById('chunk-size-value');
    if (range && display) {
      range.addEventListener('input', () => { display.textContent = range.value; });
    }
  }

  /* ---- Update payload preview text ---- */

  function updatePayloadPreview(text) {
    const el = document.getElementById('payload-preview-text');
    if (el) el.textContent = text ? text.substring(0, 40) + (text.length > 40 ? '…' : '') : '—';
  }

  /* ---- Multi-part export area ---- */

  function showMultipartExport(show) {
    const el = document.getElementById('multipart-export');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  return {
    showToast,
    initCollapsibles,
    initAccordion,
    setActiveType,
    renderForm,
    collectFormData,
    initPreviewControls,
    initLogoUpload,
    getLogoDataURL,
    hasLogo,
    showEmptyState,
    initSizeRange,
    initChunkSizeRange,
    updatePayloadPreview,
    showMultipartExport
  };

})();

window.UI = UI;
