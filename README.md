# QR Studio — by Mightora

> The most powerful browser-based QR code creator. Generate, customise, and export professional QR codes — completely free, entirely in your browser.

🔗 **Live site:** [qr.mightora.io](https://qr.mightora.io)

---

## ✨ Features

- **13 QR Types** — URL, Text, Email, Phone, SMS, WhatsApp, WiFi, vCard, Geo, Calendar, App Store, Custom, File
- **Real-time Preview** — QR updates as you type, with 300ms debounce
- **Full Customisation** — Foreground/background colours, error correction level, size, logo overlay
- **QR Analysis** — Payload size, scan difficulty score, contrast warning
- **File Encoder** — Encode text files, JSON, CSV directly into a QR code (base64 wrapped in metadata)
- **Export** — SVG, PNG (1×/2×/4×), PDF (print-ready), ZIP (all formats)
- **100% Private** — Everything runs in the browser; no data is ever sent to a server
- **Open Source** — MIT licensed

---

## 🗂 File Structure

```
qr/
├── index.html              # Single-page application
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css       # Mightora design language CSS
│   └── js/
│       ├── qr-types.js     # QR type definitions & payload builders
│       ├── qr-generator.js # Core QR generation (qrcodejs wrapper)
│       ├── file-encoder.js # File/text encoding module
│       ├── export.js       # SVG / PNG / PDF / ZIP export
│       ├── visualise.js    # Stats, density meter, scan score
│       ├── ui.js           # UI state management
│       └── app.js          # Main bootstrap & event wiring
└── data/
    └── config.json         # Site config, author info, footer data
```

---

## 🚀 Getting Started

No build step required. This is a fully static site.

```bash
# Clone the repo
git clone https://github.com/mightora/qr.git
cd qr

# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

> **Note:** The app fetches `data/config.json` via `fetch()`, so it requires a local HTTP server (not `file://`).

---

## 🔧 CDN Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [qrcodejs](https://github.com/davidshimjs/qrcodejs) | 1.0.0 | QR code generation |
| [JSZip](https://stuk.github.io/jszip/) | 3.10.1 | ZIP export |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.1 | PDF export |
| [Inter](https://rsms.me/inter/) | — | Typography (Google Fonts) |

---

## 🏗 Architecture

The app is intentionally vanilla JavaScript — no framework, no bundler, no dependencies beyond the three CDN libraries. Each module is a self-contained IIFE that exposes its API on `window`.

**Module load order:**
1. `qr-types.js` — Type definitions with `buildPayload()` functions
2. `qr-generator.js` — Wraps qrcodejs, exposes `generateQR()`, `getQRStats()`
3. `file-encoder.js` — FileReader-based encoding
4. `export.js` — Download helpers for all formats
5. `visualise.js` — WCAG contrast checking, density meter, scan score
6. `ui.js` — DOM state management, form rendering, toast notifications
7. `app.js` — Bootstrap, config loading, event wiring

---

## 🎨 Design

- **Design language:** Mightora — card-based, light theme, strong spacing
- **Primary:** `#2563eb` (blue), **Accent:** `#7c3aed` (purple)
- **Font:** Inter (Google Fonts)
- **Responsive:** Mobile → Tablet → Desktop breakpoints
- Smooth transitions, hover effects, sticky header, gradient hero

---

## 🔒 Privacy

All processing is client-side. No analytics, no tracking, no cookies. WiFi passwords, vCard details, and file contents never leave the browser.

---

## 👤 Author

**Ian Tweedie** — Developer & Power Platform Consultant  
[TechTweedie](https://techtweedie.github.io) · [GitHub](https://github.com/mightora) · [LinkedIn](https://go.iantweedie.biz/LinkedIn-Linktree) · [YouTube](https://youtube.com/@techtweedie)

---

## 📄 Licence

MIT — free to use, modify, and distribute.
