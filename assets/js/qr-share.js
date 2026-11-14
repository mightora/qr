/* QR Studio — shareable QR-only pages, generated in the visitor's browser. */
(function () {
  'use strict';
  const standard = { size:256, margin:16, errorCorrectionLevel:'M', colorDark:'#000000',
    colorLight:'#ffffff', moduleColor:'#000000', finderOuterColor:'#000000',
    finderInnerColor:'#000000', dotStyle:'square', finderStyle:'square',
    backgroundTransparent:false, useGradient:false, gradientType:'linear',
    gradientStart:'#000000', gradientEnd:'#2563eb' };
  const keys = { size:'size', margin:'margin', errorCorrectionLevel:'ec', colorDark:'fg',
    colorLight:'bg', moduleColor:'module', finderOuterColor:'outer', finderInnerColor:'inner',
    dotStyle:'dots', finderStyle:'finder', backgroundTransparent:'transparent',
    useGradient:'gradient', gradientType:'gradientType',
    gradientStart:'gradientStart', gradientEnd:'gradientEnd' };
  const colour = /^#[a-f0-9]{6}$/i;
  const integer = (v, d, min, max) => v !== '' && Number.isFinite(Number(v)) ?
    Math.max(min, Math.min(max, Math.round(Number(v)))) : d;

  function makeURL(data, options = {}) {
    if (!data || typeof data !== 'string') return '';
    const url = new URL('/embed/', location.origin);
    url.searchParams.set('data', data);
    Object.entries(keys).forEach(([name, param]) => {
      if (options[name] != null && options[name] !== standard[name])
        url.searchParams.set(param, String(options[name]));
    });
    return url.toString();
  }

  function embedHTML(url, size) {
    const px = integer(size, 256, 128, 1024);
    const safe = url.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    return '<iframe src="' + safe + '" width="' + px + '" height="' + px +
      '" title="QR code" loading="lazy" referrerpolicy="no-referrer" ' +
      'style="border:0;display:block;max-width:100%"></iframe>';
  }

  function parseOptions(params) {
    const result = { ...standard };
    for (const [name, param] of Object.entries(keys)) {
      if (!params.has(param)) continue;
      const value = params.get(param);
      if (name === 'size') result[name] = integer(value, standard[name], 128, 1024);
      else if (name === 'margin') result[name] = integer(value, standard[name], 0, 48);
      else if (name === 'errorCorrectionLevel' && /^[LMQH]$/.test(value)) result[name] = value;
      else if (name === 'dotStyle' && ['square', 'dots', 'rounded'].includes(value)) result[name] = value;
      else if (name === 'finderStyle' && ['square', 'rounded', 'circle'].includes(value)) result[name] = value;
      else if (name === 'gradientType' && ['linear', 'radial'].includes(value)) result[name] = value;
      else if (name === 'useGradient' || name === 'backgroundTransparent') result[name] = value === 'true' || value === '1';
      else if (colour.test(value)) result[name] = value;
    }
    if (!params.has('module')) result.moduleColor = result.colorDark;
    if (!params.has('outer')) result.finderOuterColor = result.colorDark;
    if (!params.has('inner')) result.finderInnerColor = result.colorDark;
    return result;
  }

  window.QRShare = { makeURL, embedHTML, parseOptions };
  const target = document.getElementById('qr-only');
  if (!target) return;
  const params = new URLSearchParams(location.search);
  const data = params.get('data') ?? params.get('text') ?? '';
  if (!data) return;
  const options = parseOptions(params);
  document.documentElement.style.background = options.backgroundTransparent ? 'transparent' : options.colorLight;
  document.body.style.background = options.backgroundTransparent ? 'transparent' : options.colorLight;
  QRGenerator.generateQR(target, data, options);
  const canvas = target.querySelector('canvas');
  if (canvas) {
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.height = 'auto';
    canvas.style.borderRadius = '0';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'QR code');
  }
})();
