const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync('assets/js/house-ads.js', 'utf8');
function boot(overrides = {}, dataset = {}, hasSlot = true) {
  const requests = [];
  const document = {
    documentElement: {dataset},
    querySelector: () => hasSlot ? {} : null,
    createElement: () => ({dataset: {}}),
    head: {appendChild: script => requests.push(script)}
  };
  const context = {document, location: {protocol: 'https:', hostname: 'qr.mightora.io', pathname: '/', ...overrides}};
  for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(context, key, {get() {throw Error('Advertising must not use storage');}});
  Object.defineProperty(document, 'cookie', {get() {throw Error('Advertising must not read cookies');}, set() {throw Error('Advertising must not write cookies');}});
  vm.runInNewContext(source, context);
  return requests;
}
test('production explicitly opts into the exact approved site', () => {
  const [script] = boot();
  assert.equal(script.dataset.site, 'qr-studio');
  assert.equal(script.dataset.domains, 'qr.mightora.io');
  assert.equal(script.dataset.enabled, 'true');
  assert.equal(script.src, 'https://mightora.github.io/shared-ads/releases/1.0.0/mightora-ads.js');
});
test('local, offline, disabled, embeds and absent slots make no ad requests', () => {
  for (const location of [{protocol:'file:'}, {hostname:'localhost'}, {hostname:'other.mightora.io'}, {pathname:'/embed/'}, {pathname:'/privacy/'}]) assert.equal(boot(location).length, 0);
  assert.equal(boot({}, {offline:'true'}).length, 0);
  assert.equal(boot({}, {ads:'off'}).length, 0);
  assert.equal(boot({}, {}, false).length, 0);
});
test('one explicit slot is separated from workspace and privacy; shared branding remains', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.equal((html.match(/<mightora-ad /g) || []).length, 1);
  assert.ok(html.indexOf('<mightora-ad ') > html.indexOf('id="help-section"'));
  assert.ok(html.indexOf('<mightora-ad ') < html.indexOf('id="privacy-section"'));
  for (const tag of ['header','author','footer']) assert.ok(html.includes('<mightora-' + tag));
  assert.ok(html.includes("connect-src 'self' https://cloudflareinsights.com https://mightora.github.io"));
  assert.ok(!readFileSync('embed/index.html', 'utf8').includes('house-ads.js'));
});
