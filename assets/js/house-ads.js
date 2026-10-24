/* Deliberate production opt-in. No remote advertising requests in local/offline editions. */
(() => {
  'use strict';
  if (location.protocol !== 'https:' || location.hostname !== 'qr.mightora.io' ||
      !['/', '/index.html'].includes(location.pathname) ||
      document.documentElement.dataset.offline === 'true' ||
      document.documentElement.dataset.ads === 'off' ||
      !document.querySelector('mightora-ad[placement="content-bottom"]')) return;
  const script = document.createElement('script');
  script.src = 'https://mightora.github.io/shared-ads/releases/1.0.0/mightora-ads.js';
  script.async = true;
  script.dataset.enabled = 'true';
  script.dataset.site = 'qr-studio';
  script.dataset.domains = 'qr.mightora.io';
  script.dataset.config = 'https://mightora.github.io/shared-ads/config/config.json';
  document.head.appendChild(script);
})();
