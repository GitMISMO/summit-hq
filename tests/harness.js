// Opens Summit HQ in a headless browser with a pretend sign-in and a pretend save relay,
// so the page can be checked without touching the real data. Nothing here reaches MISMO.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NOW = '2026-11-01T14:00:00';

const SESSION = `window.ResourcesSession={current:()=>({email:'tester@example.org',name:'Test Person'}),
  token:()=>'t',canEdit:()=>true,role:()=>'admin',requireAccess:()=>Promise.resolve(),signIn:()=>Promise.resolve(),
  onChange:()=>{},require:()=>Promise.resolve(),ready:Promise.resolve()};`;

async function open(opts = {}) {
  const file = opts.file || path.join(ROOT, 'index.html');
  const browser = opts.browser || await chromium.launch();
  const page = await browser.newPage({ viewport: { width: opts.w || 1440, height: opts.h || 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const puts = [], shas = {};
  let ver = 0;
  const store = opts.store || {};
  if (!store.ros) store.ros = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-ros.json'), 'utf8'));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('http://hq.test/summit-hq/lib/')) {
      const f = u.split('/lib/')[1].split('?')[0];
      return r.fulfill({ body: fs.readFileSync(path.join(ROOT, 'lib', f)), contentType: 'text/javascript' });
    }
    if (u.startsWith('http://hq.test/summit-hq/')) return r.fulfill({ body: fs.readFileSync(file), contentType: 'text/html' });
    if (u.includes('/assets/session.js')) return r.fulfill({ contentType: 'application/javascript', body: SESSION });
    if (u.includes('lambda-url')) {
      /* like the real relay: each file has a version, and a save made from an older version
         is refused (409) so the page reloads it and merges */
      const name = decodeURIComponent((u.split('/data/')[1] || '').split('?')[0]);
      if (r.request().method() === 'GET')
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify(store[name] ? { data: store[name], sha: shas[name] || 's0' } : { data: null }) });
      let body = {}; try { body = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
      const cur = store[name] ? (shas[name] || 's0') : null;
      if ((body.sha || null) !== cur) return r.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'CONFLICT', message: 'stale' }) });
      puts.push(name);
      if (body.content) store[name] = body.content;
      shas[name] = 's' + (++ver);
      return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ sha: shas[name] }) });
    }
    if (u.startsWith('http://hq.test')) return r.fulfill({ status: 404, body: '' });
    return r.abort();
  });
  if (page.clock && page.clock.install) await page.clock.install({ time: new Date(NOW) }).catch(() => {});
  await page.goto('http://hq.test/summit-hq/' + (opts.hash || '#ros'));
  await page.waitForTimeout(opts.settle || 4500);
  await page.evaluate(() => { const d = document.getElementById('hq-backup'); if (d) d.remove(); });
  /* a change saved meanwhile by someone else */
  const external = (name, fn) => { fn(store); shas[name] = 's' + (++ver); };
  return { browser, page, errs, puts, store, external, close: () => opts.browser ? page.close() : browser.close() };
}

module.exports = { open, NOW, ROOT };
