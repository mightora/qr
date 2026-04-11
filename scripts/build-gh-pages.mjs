import { chmod, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist-gh-pages');

const SITE_URL = 'https://qr.mightora.io';
const OG_IMAGE_PATH = '/assets/social/qr-studio-og.svg';

const configPath = path.join(rootDir, 'data', 'config.json');
const indexPath = path.join(rootDir, 'index.html');

const sourcePages = [
  { src: 'index.html', dest: 'index.html', currentPath: '/' },
  { src: 'help/index.html', dest: 'help/index.html', currentPath: '/help/' },
  { src: 'guides/qr-code-best-practices/index.html', dest: 'guides/qr-code-best-practices/index.html', currentPath: '/guides/qr-code-best-practices/' },
  { src: 'guides/qr-code-file-encoder/index.html', dest: 'guides/qr-code-file-encoder/index.html', currentPath: '/guides/qr-code-file-encoder/' },
];

const qrTypePages = [
  { id: 'url', slug: 'url-qr-code-generator', name: 'URL', seoTitle: 'URL QR Code Generator', metaDescription: 'Create a QR code for a website link. Build a free URL QR code with custom colors, SVG export, and private in-browser generation.', intro: 'URL QR codes connect printed materials, packaging, and signage directly to web destinations.', bestFor: ['Flyers and posters', 'Menus', 'Product packaging', 'Social campaigns'], tips: ['Use a short clean URL.', 'Test with and without mobile data.', 'Keep strong contrast for print.'] },
  { id: 'wifi', slug: 'wifi-qr-code-generator', name: 'WiFi', seoTitle: 'WiFi QR Code Generator', metaDescription: 'Create a WiFi QR code so guests can join a wireless network instantly. Generate secure WiFi QR codes privately in your browser.', intro: 'WiFi QR codes help guests join a network without typing long passwords.', bestFor: ['Guest WiFi', 'Reception desks', 'Hotels and rentals', 'Conference venues'], tips: ['Double-check SSID spelling.', 'Match the security type exactly.', 'Print near the network location.'] },
  { id: 'vcard', slug: 'vcard-qr-code-generator', name: 'Contact', seoTitle: 'vCard QR Code Generator', metaDescription: 'Create a vCard QR code to share contact details instantly. Build contact QR codes for business cards, events, and sales materials.', intro: 'vCard QR codes let people save a full contact directly into their phone.', bestFor: ['Business cards', 'Email signatures', 'Trade shows', 'Staff profiles'], tips: ['Include only useful contact fields.', 'Check phone and email formatting.', 'Test import behavior on iPhone and Android.'] },
  { id: 'email', slug: 'email-qr-code-generator', name: 'Email', seoTitle: 'Email QR Code Generator', metaDescription: 'Create an email QR code with a pre-filled address, subject, and message. Useful for support desks, campaigns, and quick contact actions.', intro: 'Email QR codes open the user\'s mail app with the recipient already filled in.', bestFor: ['Customer support', 'Lead capture', 'Printed ads', 'Contact pages'], tips: ['Keep the subject short.', 'Avoid overlong body text.', 'Use a monitored inbox.'] },
  { id: 'phone', slug: 'phone-qr-code-generator', name: 'Phone', seoTitle: 'Phone QR Code Generator', metaDescription: 'Create a phone number QR code that opens the dialer instantly. Great for service businesses, vans, posters, and printed contact materials.', intro: 'Phone QR codes prompt a call action immediately after scan.', bestFor: ['Service businesses', 'Vehicle signage', 'Sales collateral', 'Emergency contact posters'], tips: ['Use international format where possible.', 'Check spacing and symbols are cleaned correctly.', 'Place next to a clear call to action.'] },
  { id: 'sms', slug: 'sms-qr-code-generator', name: 'SMS', seoTitle: 'SMS QR Code Generator', metaDescription: 'Create an SMS QR code with a pre-filled number and message. Useful for support, voting, opt-in flows, and mobile-first campaigns.', intro: 'SMS QR codes open the default texting app with a message ready to send.', bestFor: ['Text-to-join campaigns', 'Support requests', 'Voting or polling', 'Field operations'], tips: ['Keep the message compact.', 'Make the next step obvious.', 'Test on both iOS and Android messaging apps.'] },
  { id: 'whatsapp', slug: 'whatsapp-qr-code-generator', name: 'WhatsApp', seoTitle: 'WhatsApp QR Code Generator', metaDescription: 'Create a WhatsApp QR code with a pre-filled message. Help customers start a chat quickly from posters, packaging, or websites.', intro: 'WhatsApp QR codes work well when your audience prefers chat over forms or email.', bestFor: ['Customer support', 'Sales outreach', 'Packaging inserts', 'Event follow-ups'], tips: ['Use the correct country code.', 'Keep the prompt message natural.', 'Confirm the chat opens correctly on mobile.'] },
  { id: 'geo', slug: 'location-qr-code-generator', name: 'Location', seoTitle: 'Location QR Code Generator', metaDescription: 'Create a location QR code for GPS coordinates. Send users directly to a map location for events, venues, offices, or pickup points.', intro: 'Location QR codes open mapping apps at a specific coordinate.', bestFor: ['Event venues', 'Pickup points', 'Remote meeting locations', 'Property signage'], tips: ['Check the map pin is exact.', 'Add a visible place label nearby.', 'Test outdoors if navigation matters.'] },
  { id: 'event', slug: 'calendar-event-qr-code-generator', name: 'Calendar', seoTitle: 'Calendar Event QR Code Generator', metaDescription: 'Create a calendar event QR code so users can add meetings, webinars, or appointments to their device quickly.', intro: 'Calendar QR codes package event details so users can save them after scanning.', bestFor: ['Webinars', 'Conferences', 'Appointments', 'Meetups'], tips: ['Use clear date and time values.', 'Include the location when relevant.', 'Check timezone handling in your workflow.'] },
  { id: 'appstore', slug: 'app-store-qr-code-generator', name: 'App Store', seoTitle: 'App Store QR Code Generator', metaDescription: 'Create an app store QR code for iOS, Google Play, or a universal app landing page. Ideal for onboarding, packaging, and launch campaigns.', intro: 'App store QR codes move users from physical materials to your app listing quickly.', bestFor: ['Product packaging', 'Launch campaigns', 'Retail displays', 'Conference booths'], tips: ['Use the final app listing URL.', 'Consider a universal landing page.', 'Track campaign performance outside the QR itself.'] },
  { id: 'text', slug: 'text-qr-code-generator', name: 'Plain Text', seoTitle: 'Text QR Code Generator', metaDescription: 'Create a plain text QR code for instructions, notes, short messages, and offline information sharing.', intro: 'Plain text QR codes are useful for short instructions and offline information sharing.', bestFor: ['Instructions', 'Labels', 'Offline notes', 'Reference text'], tips: ['Keep the text short.', 'Avoid unnecessary formatting.', 'Use larger print sizes for longer payloads.'] },
  { id: 'custom', slug: 'custom-qr-code-generator', name: 'Custom', seoTitle: 'Custom QR Code Generator', metaDescription: 'Create a custom QR code for raw structured payloads, JSON, or specialist data formats using a free browser-based QR generator.', intro: 'Custom QR codes are useful when you need to encode a specialist payload exactly as written.', bestFor: ['Developer workflows', 'Custom payloads', 'Structured data', 'Prototype integrations'], tips: ['Validate the payload before publishing.', 'Document the expected scan behavior.', 'Test with the actual target app or parser.'] },
  { id: 'file', slug: 'file-qr-code-generator', name: 'File', seoTitle: 'File QR Code Generator', metaDescription: 'Create a file QR code for small text-based files like TXT, CSV, JSON, and XML. Generate file QR codes privately in your browser.', intro: 'File QR codes are best for compact text-based content where offline transfer matters.', bestFor: ['Small JSON files', 'CSV snippets', 'Offline configs', 'Compact text documents'], tips: ['Keep files very small.', 'Prefer text formats over binary.', 'Use a URL QR code when the payload grows.'] },
];

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function absoluteUrl(relativePath) {
  return `${SITE_URL}${relativePath}`;
}

function renderHeader(currentPath = '/') {
  const navItems = [
    { label: 'Studio', href: '/' },
    { label: 'Help', href: '/help/' },
    { label: 'QR Types', href: '/types/' },
    { label: 'Best Practices', href: '/guides/qr-code-best-practices/' },
    { label: 'GitHub', href: 'https://github.com/mightora/qr', external: true },
  ];

  const links = navItems.map((item) => {
    const active = !item.external && currentPath === item.href;
    const activeClass = active ? ' is-active' : '';
    const target = item.external ? ' target="_blank"' : '';
    const rel = item.external ? ' rel="noopener"' : '';
    const suffix = item.external ? ' <span aria-hidden="true">-></span>' : '';
    return `<a class="site-shell-link${activeClass}" href="${item.href}"${target}${rel}>${escapeHtml(item.label)}${suffix}</a>`;
  }).join('');

  return `
  <header class="site-shell-header">
    <div class="container site-shell-header-inner">
      <a class="site-shell-brand" href="/">
        <span class="site-shell-brand-mark">QR</span>
        <span class="site-shell-brand-text">Studio</span>
      </a>
      <nav class="site-shell-nav" aria-label="Primary">
        ${links}
      </nav>
    </div>
  </header>`;
}

function renderAuthor(author) {
  const links = (author.links || [])
    .map((link) => {
      const icon = link.icon ? `<i class="${escapeHtml(link.icon)}" aria-hidden="true"></i>` : '';
      return `
        <a class="author-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
          ${icon}
          <span>${escapeHtml(link.label)}</span>
        </a>`;
    })
    .join('');

  const branding = author.branding?.label && author.branding?.url
    ? `
        <a class="author-brand" href="${escapeHtml(author.branding.url)}" target="_blank" rel="noopener">
          ${escapeHtml(author.branding.label)}
        </a>`
    : '';

  return `
  <section id="author-section" class="author-section" aria-labelledby="author-title">
    <div class="container">
      <div class="author-card">
        <div class="author-portrait-wrap">
          <img class="author-portrait" src="${escapeHtml(author.image)}" alt="${escapeHtml(author.name)}">
        </div>
        <div class="author-copy">
          <p class="author-kicker">Built by</p>
          <h2 id="author-title" class="author-name">${escapeHtml(author.name)}</h2>
          <p class="author-role">${escapeHtml(author.role)}</p>
          <p class="author-bio">${escapeHtml(author.bio)}</p>
          <div class="author-links">
            ${links}
          </div>
          ${branding}
        </div>
      </div>
    </div>
  </section>`;
}

function renderFooter(footer) {
  const currentYear = new Date().getUTCFullYear();
  const brandCards = (footer.brands || [])
    .map((brand) => `
      <a class="site-footer-brand" href="${escapeHtml(brand.url)}" target="_blank" rel="noopener">
        <img class="site-footer-brand-logo" src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name)} logo">
        <div>
          <div class="site-footer-brand-name">${escapeHtml(brand.name)}</div>
          <p class="site-footer-brand-description">${escapeHtml(brand.description)}</p>
        </div>
      </a>`)
    .join('');

  const sectionsByColumn = new Map();
  for (const section of footer.sections || []) {
    const column = Number(section.column) || 1;
    if (!sectionsByColumn.has(column)) {
      sectionsByColumn.set(column, []);
    }
    sectionsByColumn.get(column).push(section);
  }

  const orderedColumns = [...sectionsByColumn.keys()].sort((a, b) => a - b);
  const sectionColumns = orderedColumns
    .map((column) => {
      const sections = sectionsByColumn.get(column)
        .map((section) => {
          const links = (section.links || [])
            .map((link) => `
              <li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.name)}</a></li>`)
            .join('');

          return `
            <section class="site-footer-nav-group" aria-label="${escapeHtml(section.title)}">
              <h3>${escapeHtml(section.title)}</h3>
              <ul>
                ${links}
              </ul>
            </section>`;
        })
        .join('');

      return `
        <div class="site-footer-nav-column">
          ${sections}
        </div>`;
    })
    .join('');

  return `
  <footer class="site-footer" aria-label="Site footer">
    <div class="container">
      <div class="site-footer-grid">
        <div class="site-footer-brands">
          ${brandCards}
        </div>
        <div class="site-footer-nav">
          ${sectionColumns}
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copy">
          &copy; ${currentYear}
          <a href="https://mightora.io" target="_blank" rel="noopener">Mightora.io</a>
          &amp; <a href="https://techtweedie.github.io" target="_blank" rel="noopener">TechTweedie</a>.
          Built by <a href="https://iantweedie.biz" target="_blank" rel="noopener">Ian Tweedie</a>.
          All QR generation is local &mdash; your data never leaves your browser.
        </div>
      </div>
    </div>
  </footer>`;
}

function injectOrReplaceInjected(html, injection, marker) {
  const regex = new RegExp(`<!-- ${marker} \\(Mightora Shared UI\) -->\\s*<mightora-${marker.toLowerCase()}[\\s\\S]*?<\\/mightora-${marker.toLowerCase()}>`);
  if (regex.test(html)) {
    return html.replace(regex, `<!-- ${marker} (Generated for gh-pages) -->\n${injection}`);
  }
  return html;
}

function transformHtmlForPublish(html, currentPath, author, footer) {
  // let outputHtml = injectOrReplaceInjected(html, renderHeader(currentPath), 'HEADER');
  // outputHtml = injectOrReplaceInjected(outputHtml, renderAuthor(author), 'AUTHOR SECTION');
  // outputHtml = injectOrReplaceInjected(outputHtml, renderFooter(footer), 'FOOTER');

  // outputHtml = outputHtml.replace(
  //   /\s*<!-- js-yaml \(required by mightora-footer to parse the YAML feed\) -->\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/js-yaml@4\.1\.0\/dist\/js-yaml\.min\.js"><\/script>/,
  //   ''
  // );
  return html;
}

function renderBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function renderPageLayout({ title, description, canonicalPath, schema, heroBadge, heading, subtitle, bodyHtml, currentPath, footer }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob: https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests">
  <link rel="canonical" href="${absoluteUrl(canonicalPath)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${absoluteUrl(canonicalPath)}">
  <meta property="og:image" content="${absoluteUrl(OG_IMAGE_PATH)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${absoluteUrl(OG_IMAGE_PATH)}">
  <link rel="icon" href="/assets/social/qr-studio-og.svg" type="image/svg+xml">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mightora/shared-ui@v1.0.0/shared.css">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>
</head>
<body>
  ${renderHeader(currentPath)}
  <section class="hero hero--compact">
    <div class="container">
      <div class="hero-content">
        <div class="hero-badge">${escapeHtml(heroBadge)}</div>
        <h1 class="hero-title">${escapeHtml(heading)}</h1>
        <p class="hero-subtitle">${escapeHtml(subtitle)}</p>
      </div>
    </div>
  </section>
  <main class="main-content">
    ${bodyHtml}
  </main>
  ${renderFooter(footer)}
</body>
</html>`;
}

function renderTypesIndexPage(footer) {
  const cards = qrTypePages.map((type) => `
    <a class="content-hub-card" href="/types/${type.slug}/">
      <strong>${escapeHtml(type.seoTitle)}</strong>
      <span>${escapeHtml(type.metaDescription)}</span>
    </a>`).join('');

  return renderPageLayout({
    title: 'QR Code Generator Types | QR Studio',
    description: 'Browse QR code generator pages for URL, WiFi, vCard, email, SMS, WhatsApp, files, locations, and more.',
    canonicalPath: '/types/',
    schema: renderBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'QR Types', path: '/types/' }]),
    heroBadge: 'QR Types',
    heading: 'QR Code Generator Types',
    subtitle: 'Dedicated landing pages for each QR format supported by QR Studio.',
    currentPath: '/types/',
    footer,
    bodyHtml: `
    <section class="section">
      <div class="container prose">
        <p class="lead">These landing pages target common search intent while guiding visitors into the main interactive generator.</p>
        <div class="content-hub content-hub--two">
          ${cards}
        </div>
      </div>
    </section>`,
  });
}

function renderTypePage(type, footer) {
  const bestFor = type.bestFor.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const tips = type.tips.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const pagePath = `/types/${type.slug}/`;

  return renderPageLayout({
    title: `${type.seoTitle} | QR Studio`,
    description: type.metaDescription,
    canonicalPath: pagePath,
    schema: renderBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'QR Types', path: '/types/' }, { name: type.seoTitle, path: pagePath }]),
    heroBadge: 'QR Type Guide',
    heading: type.seoTitle,
    subtitle: type.metaDescription,
    currentPath: '/types/',
    footer,
    bodyHtml: `
    <section class="section">
      <div class="container prose">
        <p class="lead">${escapeHtml(type.intro)}</p>
        <h2>When to use this QR code type</h2>
        <p>${escapeHtml(type.seoTitle)} workflows are most useful when you want a low-friction mobile action after a scan and a clear user outcome.</p>
        <h2>Best use cases</h2>
        <ul class="content-list">
          ${bestFor}
        </ul>
        <h2>Practical tips</h2>
        <ul class="content-list">
          ${tips}
        </ul>
        <h2>Create one now</h2>
        <p>Open the main <a href="/#type-selector">QR Studio generator</a> and choose <strong>${escapeHtml(type.name)}</strong> to build, style, and export your QR code.</p>
        <div class="inline-callout">
          <strong>Related reading:</strong> Visit the <a href="/help/">QR help page</a> or the <a href="/guides/qr-code-best-practices/">best practices guide</a> to improve scan reliability.
        </div>
      </div>
    </section>`,
  });
}

function render404Page(footer) {
  return renderPageLayout({
    title: 'Page Not Found | QR Studio',
    description: 'The page you requested could not be found. Visit QR Studio, browse QR type pages, or read the help guides.',
    canonicalPath: '/404.html',
    schema: renderBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: '404', path: '/404.html' }]),
    heroBadge: '404',
    heading: 'Page not found',
    subtitle: 'The page may have moved, the URL may be wrong, or the content may no longer exist.',
    currentPath: '/404.html',
    footer,
    bodyHtml: `
    <section class="section">
      <div class="container prose">
        <p class="lead">You can still get back to the generator quickly.</p>
        <div class="content-hub content-hub--two">
          <a class="content-hub-card" href="/"><strong>Open QR Studio</strong><span>Return to the main QR code generator.</span></a>
          <a class="content-hub-card" href="/types/"><strong>Browse QR Types</strong><span>See all dedicated QR type landing pages.</span></a>
          <a class="content-hub-card" href="/help/"><strong>Read Help and FAQ</strong><span>Get answers to common QR code questions.</span></a>
          <a class="content-hub-card" href="/guides/qr-code-best-practices/"><strong>Read Best Practices</strong><span>Learn how to make QR codes scan more reliably.</span></a>
        </div>
      </div>
    </section>`,
  });
}

async function makeWritableRecursive(targetPath) {
  try {
    const targetStat = await stat(targetPath);
    await chmod(targetPath, targetStat.isDirectory() ? 0o777 : 0o666);

    if (!targetStat.isDirectory()) {
      return;
    }

    const entries = await readdir(targetPath, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      await makeWritableRecursive(path.join(targetPath, entry.name));
    }));
  } catch {
    // Ignore cleanup failures for paths that do not yet exist.
  }
}

async function copyIntoOutput(from, to, options) {
  try {
    await cp(from, to, options);
  } catch (error) {
    if (error && error.code === 'EPERM') {
      console.warn(`Skipping overwrite for locked path: ${to}`);
      return;
    }
    throw error;
  }
}

async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeOutputFile(relativePath, content) {
  const targetPath = path.join(outDir, relativePath);
  await ensureParentDir(targetPath);
  await writeFile(targetPath, content, 'utf8');
}

async function build() {
  const configRaw = await readFile(configPath, 'utf8');
  const config = JSON.parse(configRaw);

  await makeWritableRecursive(outDir);
  try {
    await rm(outDir, { recursive: true, force: true });
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      console.warn(`Continuing without deleting existing output directory: ${error.code}`);
    }
  }
  await mkdir(outDir, { recursive: true });

  const rootDirs = ['assets', 'data'];
  await Promise.all(rootDirs.map(async (dir) => {
    await copyIntoOutput(path.join(rootDir, dir), path.join(outDir, dir), { recursive: true });
  }));

  const rootFiles = ['CNAME', 'robots.txt', 'site.webmanifest'];
  await Promise.all(rootFiles.map(async (file) => {
    await copyIntoOutput(path.join(rootDir, file), path.join(outDir, file));
  }));

  for (const page of sourcePages) {
    const html = await readFile(path.join(rootDir, page.src), 'utf8');
    const transformed = transformHtmlForPublish(html, page.currentPath, config.author, config.footer);
    await writeOutputFile(page.dest, transformed);
  }

  await writeOutputFile('types/index.html', renderTypesIndexPage(config.footer));
  for (const type of qrTypePages) {
    await writeOutputFile(`types/${type.slug}/index.html`, renderTypePage(type, config.footer));
  }
  await writeOutputFile('404.html', render404Page(config.footer));

  const sitemapPaths = [
    '/',
    '/help/',
    '/types/',
    '/guides/qr-code-best-practices/',
    '/guides/qr-code-file-encoder/',
    ...qrTypePages.map((type) => `/types/${type.slug}/`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((pagePath) => `  <url>\n    <loc>${absoluteUrl(pagePath)}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  await writeOutputFile('sitemap.xml', sitemap);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
