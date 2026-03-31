/* ============================================================
   qr-types.js — QR Type Definitions
   ============================================================ */

const QRTypes = {

  url: {
    id: 'url',
    name: 'URL',
    icon: '🔗',
    description: 'Website or link',
    plainEnglish: 'Scanning this QR code will open a web page in the user\'s browser.',
    fields: [
      { id: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com', required: true }
    ],
    buildPayload(data) {
      let url = (data.url || '').trim();
      if (url && !url.match(/^https?:\/\//i)) url = 'https://' + url;
      return url;
    }
  },

  text: {
    id: 'text',
    name: 'Plain Text',
    icon: '📝',
    description: 'Any text content',
    plainEnglish: 'Scanning this QR code will display a plain text message.',
    fields: [
      { id: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter any text here...', required: true }
    ],
    buildPayload(data) {
      return (data.text || '').trim();
    }
  },

  email: {
    id: 'email',
    name: 'Email',
    icon: '✉️',
    description: 'Pre-filled email',
    plainEnglish: 'Scanning this QR code will open the user\'s email app with a pre-filled message.',
    fields: [
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'recipient@example.com', required: true },
      { id: 'subject', label: 'Subject (optional)', type: 'text', placeholder: 'Email subject' },
      { id: 'body', label: 'Body (optional)', type: 'textarea', placeholder: 'Email body...' }
    ],
    buildPayload(data) {
      let payload = `mailto:${(data.email || '').trim()}`;
      const params = [];
      if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
      if (params.length) payload += '?' + params.join('&');
      return payload;
    }
  },

  phone: {
    id: 'phone',
    name: 'Phone',
    icon: '📞',
    description: 'Phone number to call',
    plainEnglish: 'Scanning this QR code will prompt the user to call a phone number.',
    fields: [
      { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+44 7700 900000', required: true }
    ],
    buildPayload(data) {
      const num = (data.phone || '').trim().replace(/\s+/g, '');
      return `tel:${num}`;
    }
  },

  sms: {
    id: 'sms',
    name: 'SMS',
    icon: '💬',
    description: 'Pre-filled SMS',
    plainEnglish: 'Scanning this QR code will open the SMS app with a pre-filled message ready to send.',
    fields: [
      { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+44 7700 900000', required: true },
      { id: 'message', label: 'Message (optional)', type: 'textarea', placeholder: 'Pre-filled message text...' }
    ],
    buildPayload(data) {
      const num = (data.phone || '').trim().replace(/\s+/g, '');
      const msg = (data.message || '').trim();
      return `smsto:${num}${msg ? ':' + msg : ''}`;
    }
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💚',
    description: 'WhatsApp message',
    plainEnglish: 'Scanning this QR code will open WhatsApp with a pre-filled message ready to send.',
    fields: [
      { id: 'phone', label: 'Phone Number (with country code)', type: 'tel', placeholder: '+44 7700 900000', required: true },
      { id: 'message', label: 'Message (optional)', type: 'textarea', placeholder: 'Pre-filled WhatsApp message...' }
    ],
    buildPayload(data) {
      const num = (data.phone || '').trim().replace(/[\s+\-()]/g, '');
      const msg = (data.message || '').trim();
      let url = `https://wa.me/${num}`;
      if (msg) url += `?text=${encodeURIComponent(msg)}`;
      return url;
    }
  },

  wifi: {
    id: 'wifi',
    name: 'WiFi',
    icon: '📶',
    description: 'Join a WiFi network',
    plainEnglish: 'Scanning this QR code will offer to automatically join a WiFi network.',
    fields: [
      { id: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWiFiNetwork', required: true },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'WiFi password', passwordToggle: true },
      { id: 'security', label: 'Security Type', type: 'select', options: ['WPA', 'WEP', 'nopass'], required: true },
      { id: 'hidden', label: 'Hidden Network', type: 'checkbox' }
    ],
    buildPayload(data) {
      const ssid = (data.ssid || '').replace(/[\\;,"]/g, c => '\\' + c);
      const pass = (data.password || '').replace(/[\\;,"]/g, c => '\\' + c);
      const sec = data.security || 'WPA';
      const hidden = data.hidden ? 'true' : 'false';
      return `WIFI:T:${sec};S:${ssid};P:${pass};H:${hidden};;`;
    }
  },

  vcard: {
    id: 'vcard',
    name: 'Contact',
    icon: '👤',
    description: 'vCard contact info',
    plainEnglish: 'Scanning this QR code will offer to save a contact to the user\'s address book.',
    fields: [
      { id: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
      { id: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Smith' },
      { id: 'org', label: 'Organisation', type: 'text', placeholder: 'Company Name' },
      { id: 'title', label: 'Job Title', type: 'text', placeholder: 'Software Engineer' },
      { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+44 7700 900000' },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
      { id: 'website', label: 'Website', type: 'text', placeholder: 'https://example.com' },
      { id: 'street', label: 'Street', type: 'text', placeholder: '123 Main Street' },
      { id: 'city', label: 'City', type: 'text', placeholder: 'London' },
      { id: 'postcode', label: 'Postcode / ZIP', type: 'text', placeholder: 'SW1A 1AA' },
      { id: 'country', label: 'Country', type: 'text', placeholder: 'United Kingdom' }
    ],
    buildPayload(data) {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      const fn = [data.firstName, data.lastName].filter(Boolean).join(' ');
      lines.push(`N:${data.lastName || ''};${data.firstName || ''};;;`);
      lines.push(`FN:${fn}`);
      if (data.org) lines.push(`ORG:${data.org}`);
      if (data.title) lines.push(`TITLE:${data.title}`);
      if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.website) lines.push(`URL:${data.website}`);
      const adr = [data.street, data.city, data.postcode, data.country].filter(Boolean);
      if (adr.length) lines.push(`ADR:;;${data.street || ''};${data.city || ''};;${data.postcode || ''};${data.country || ''}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
  },

  geo: {
    id: 'geo',
    name: 'Location',
    icon: '📍',
    description: 'GPS coordinates',
    plainEnglish: 'Scanning this QR code will open the user\'s maps app at the specified location.',
    fields: [
      { id: 'lat', label: 'Latitude', type: 'number', placeholder: '51.5074', required: true },
      { id: 'lng', label: 'Longitude', type: 'number', placeholder: '-0.1278', required: true },
      { id: 'label', label: 'Label (optional)', type: 'text', placeholder: 'London, UK' }
    ],
    buildPayload(data) {
      const lat = parseFloat(data.lat || 0).toFixed(6);
      const lng = parseFloat(data.lng || 0).toFixed(6);
      return `geo:${lat},${lng}`;
    }
  },

  event: {
    id: 'event',
    name: 'Calendar',
    icon: '📅',
    description: 'Add calendar event',
    plainEnglish: 'Scanning this QR code will offer to add an event to the user\'s calendar.',
    fields: [
      { id: 'title', label: 'Event Title', type: 'text', placeholder: 'Team Meeting', required: true },
      { id: 'location', label: 'Location', type: 'text', placeholder: 'London, UK or https://meet.link' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Event description...' },
      { id: 'startDate', label: 'Start Date', type: 'text', placeholder: '20251225T090000' },
      { id: 'endDate', label: 'End Date', type: 'text', placeholder: '20251225T100000' }
    ],
    buildPayload(data) {
      const formatDT = (s) => s ? s.replace(/[-:]/g, '').replace('T', 'T').substring(0, 15) : '';
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${data.title || ''}`,
        `DTSTART:${formatDT(data.startDate)}`,
        `DTEND:${formatDT(data.endDate)}`
      ];
      if (data.location) lines.push(`LOCATION:${data.location}`);
      if (data.description) lines.push(`DESCRIPTION:${data.description}`);
      lines.push('END:VEVENT', 'END:VCALENDAR');
      return lines.join('\n');
    }
  },

  appstore: {
    id: 'appstore',
    name: 'App Store',
    icon: '📱',
    description: 'Link to an app',
    plainEnglish: 'Scanning this QR code will open an app store listing.',
    fields: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['iOS App Store', 'Google Play', 'Universal URL'], required: true },
      { id: 'appUrl', label: 'App URL', type: 'text', placeholder: 'https://apps.apple.com/app/id123456', required: true },
      { id: 'appName', label: 'App Name (optional)', type: 'text', placeholder: 'My App' }
    ],
    buildPayload(data) {
      return (data.appUrl || '').trim();
    }
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    icon: '⚙️',
    description: 'Raw structured data',
    plainEnglish: 'This QR code contains custom/raw data as-is.',
    fields: [
      { id: 'data', label: 'Custom Data', type: 'textarea', placeholder: 'Enter any raw data, JSON, or custom format...', required: true }
    ],
    buildPayload(data) {
      return (data.data || '').trim();
    }
  },

  file: {
    id: 'file',
    name: 'File',
    icon: '📁',
    description: 'Encode a small file',
    plainEnglish: 'This QR code contains an encoded file. Use the File Encoder section below to encode your file.',
    fields: [
      { id: 'note', label: 'Use the File Encoder panel to encode a file', type: 'text', placeholder: 'Encoded content will appear here automatically', required: false }
    ],
    buildPayload(data) {
      return (data.note || '').trim();
    }
  }
};

// Export for use in other modules
window.QRTypes = QRTypes;
