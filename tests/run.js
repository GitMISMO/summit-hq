// Summit HQ checks. Run with:  npm test   (or: node tests/run.js)
// Every check opens the page against a pretend relay with sample data, so nothing real is
// read or changed. The run fails (exit code 1) if any check fails; GitHub then emails the
// person who uploaded the change.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');
const { open, NOW, ROOT } = require('./harness');

const results = [];
let browser;
const only = process.argv.slice(2);

async function check(name, fn) {
  if (only.length && !only.some(o => name.toLowerCase().includes(o.toLowerCase()))) return;
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); console.log('  PASS  ' + name); }
  catch (e) { results.push({ name, ok: false, why: e.message }); console.log('  FAIL  ' + name + '\n        ' + String(e.message).split('\n').join('\n        ')); }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }
const noErrors = (errs, where) => expect(!errs.length, 'Page errors' + (where ? ' on ' + where : '') + ':\n' + errs.join('\n'));
const minsAgo = m => new Date(new Date(NOW).getTime() - m * 60000).toISOString();

(async () => {
  browser = await chromium.launch();
  const opts = o => Object.assign({ browser }, o || {});

  /* 1. Every script on every page reads as valid JavaScript */
  await check('Every page script parses', async () => {
    const bad = [];
    for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const re = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g; let m, i = 0;
      while ((m = re.exec(html))) {
        i++; if (/type=["'](?!text\/javascript|module)/.test(m[1])) continue;
        try { new vm.Script(m[2], { filename: f + ' script ' + i }); } catch (e) { bad.push(f + ' script ' + i + ': ' + e.message); }
      }
    }
    expect(!bad.length, bad.join('\n'));
  });

  /* 2. Every tab opens with no errors */
  await check('Every tab opens without errors', async () => {
    const s = await open(opts());
    const broken = [];
    for (const tab of ['ros', 'grid', 'gs', 'wk', 'people', 'reg', 'specs', 'resume', 'trunk', 'help']) {
      const before = s.errs.length;
      await s.page.evaluate(t => window.__hqGo(t), tab);
      await s.page.waitForTimeout(1500);
      const shown = await s.page.evaluate(t => { const el = document.getElementById('app-' + t); return !!el && !el.hidden && el.offsetParent !== null; }, tab);
      if (!shown) broken.push(tab + ': did not show');
      if (s.errs.length > before) broken.push(tab + ': ' + s.errs.slice(before).join(' | '));
    }
    await s.close();
    expect(!broken.length, broken.join('\n'));
  });

  /* 3. Saving: a change reaches the relay and comes back after a reload; a big document is
        split into parts and put back together */
  await check('Saves reach the relay and come back, big ones in parts', async () => {
    const s = await open(opts());
    await s.page.evaluate(async () => { const db = await window.claude.use('db');
      await db.doc('tasks/zz-test').set({ task: 'Check Task', owner: 'Test Person', status: 'Not Started', scope: 'This Summit Only' });
      await db.doc('archive/zz-big').set({ blob: 'x'.repeat(2100000) }); });
    await s.page.waitForTimeout(3500);
    expect(s.store.ros.docs['tasks/zz-test'], 'the task was not written to the Run of Show file');
    expect(Object.keys(s.store).some(k => /^arch-zz-big--/.test(k)), 'the big document was not written in parts');
    await s.page.reload(); await s.page.waitForTimeout(4500);
    const back = await s.page.evaluate(async () => { const db = await window.claude.use('db');
      const a = await db.doc('tasks/zz-test').get(), b = await db.doc('archive/zz-big').get();
      return [a.exists && a.data().task, b.exists && b.data().blob.length]; });
    expect(back[0] === 'Check Task', 'the task did not come back after a reload');
    expect(back[1] === 2100000, 'the big document came back as ' + back[1] + ' characters');
    noErrors(s.errs); await s.close();
  });

  /* 4. Two people changing different things on the same record both keep their change */
  await check('Two changes to one record merge', async () => {
    const s = await open(opts());
    const r = await s.page.evaluate(async () => { const db = await window.claude.use('db');
      const id = Object.keys(window.__hqRelay.files.ros.server.docs).find(k => k.startsWith('tasks/'));
      return id; });
    s.external('ros', st => { st.ros.docs[r] = Object.assign({}, st.ros.docs[r], { owner: 'Someone Else' }); });   /* saved meanwhile elsewhere */
    await s.page.evaluate(async id => { const db = await window.claude.use('db'); await db.doc(id).update({ status: 'Complete' }); }, r);
    await s.page.waitForTimeout(3500);
    const d = s.store.ros.docs[r];
    expect(d.status === 'Complete', 'this page\'s change was lost');
    expect(d.owner === 'Someone Else', 'the other person\'s change was overwritten');
    await s.close();
  });

  /* 5. Session details belong to the summit they were changed in */
  await check('Session details are kept per summit', async () => {
    const store = { schedule: { docs: { 'schedule/summits': { sessionEdits: { bod: { notes: 'Shared note', av: 'Rally' } } } } } };
    const s = await open(opts({ store }));
    await s.page.evaluate(() => window.__hqGo('grid')); await s.page.waitForTimeout(2500);
    await s.page.evaluate(() => window.__agentApply.setEdit('bod', { av: 'Winter AV', notes: 'Winter note' })); await s.page.waitForTimeout(800);
    await s.page.evaluate(() => window.__scheduleSetVenue('slc')); await s.page.waitForTimeout(1500);
    await s.page.evaluate(() => window.__agentApply.setEdit('bod', { av: 'Spring AV' })); await s.page.waitForTimeout(1500);
    await s.page.evaluate(() => window.__scheduleSetVenue('nola')); await s.page.waitForTimeout(1500);
    const d = await s.page.evaluate(async () => { const db = await window.claude.use('db'); const x = (await db.doc('schedule/summits').get()).data();
      const v = id => (x.venues.find(v => v.id === id).sessEdits || {}).bod || {}; return { nola: v('nola'), slc: v('slc') }; });
    expect(d.nola.av === 'Winter AV' && d.slc.av === 'Spring AV', 'AV was not kept per summit: ' + JSON.stringify(d));
    noErrors(s.errs); await s.close();
  });

  /* 6. A summit that is over keeps its Run of Show, and Past Summits shows it */
  await check('Past Summits keeps a finished summit\'s Run of Show', async () => {
    const s = await open(opts());
    s.store.ros.docs['summits/f2026'] = { name: 'Fall Summit 2026', start: '2026-09-14', end: '2026-09-17', venue: 'Old Hotel', order: 6 };
    s.store.ros.docs['meta/config'].activeSummitId = 'f2026';
    s.store.ros.docs['notes/n1'] = { text: 'Old note from fall', createdAt: '2026-09-01T10:00:00Z', taskId: '' };
    await s.page.reload(); await s.page.waitForTimeout(6000);
    await s.page.evaluate(() => window.__hqGo('ros')); await s.page.waitForTimeout(1500);
    for (const v of ['slc', 'nola']) {
      await s.page.evaluate(v => { const p = document.getElementById('venue-pick'); p.value = v; p.dispatchEvent(new Event('change', { bubbles: true })); }, v);
      await s.page.waitForTimeout(2500);
    }
    expect(Object.keys(s.store).some(k => /arch-ros-f2026/.test(k)), 'no record was kept for the finished summit');
    await s.page.evaluate(() => document.getElementById('cgPast').click()); await s.page.waitForTimeout(1500);
    const txt = await s.page.evaluate(() => { const m = document.getElementById('ros-past'); return m ? m.innerText : ''; });
    expect(/Fall Summit 2026/.test(txt) && /Old note from fall/.test(txt), 'Past Summits did not show the kept record');
    noErrors(s.errs); await s.close();
  });

  /* 7. The Board and MISMO Team emails draw for another summit */
  await check('Board and MISMO Team emails draw', async () => {
    const store = { resume: { docs: { 'resume/slc': { details: { hotelName: 'Sample Hotel' } } } },
      'team-travel': { docs: { 'team-travel/slc': { order: ['a'], ppl: { a: { n: 'Test Person', e: 'tester@example.org', role: 'staff' } } } } } };
    const s = await open(opts({ store }));
    await s.page.evaluate(() => window.__hqGo('people')); await s.page.waitForTimeout(2000);
    await s.page.evaluate(() => { const p = document.getElementById('venue-pick'); p.value = 'slc'; p.dispatchEvent(new Event('change', { bubbles: true })); });
    await s.page.waitForTimeout(4000);
    const card = t => s.page.evaluate(t => { const c = [...document.querySelectorAll('.psec')].find(c => new RegExp(t).test(c.querySelector('.psec-hd').textContent)); c.querySelector('.psec-hd').click(); }, t);
    await card('Board of Directors'); await s.page.waitForTimeout(1200);
    await s.page.evaluate(() => [...document.querySelectorAll('.bd-top .btn')].find(b => /Ask In Person/.test(b.textContent)).click()); await s.page.waitForTimeout(1500);
    const board = await s.page.evaluate(() => { const f = document.querySelector('#bd-ask iframe'); return f ? new DOMParser().parseFromString(f.srcdoc, 'text/html').body.innerText : ''; });
    expect(/Spring Summit/.test(board) && /In Person/i.test(board), 'the Board email did not draw for the Spring Summit');
    await s.page.evaluate(() => document.querySelector('#bd-ask .se-x').click());
    await card('MISMO Team'); await s.page.waitForTimeout(2500);
    await s.page.evaluate(() => [...document.querySelectorAll('.tt-acts .btn')].find(b => /Ask for Travel/.test(b.textContent)).click()); await s.page.waitForTimeout(1800);
    const team = await s.page.evaluate(() => { const f = document.querySelector('#tt-ask iframe'); return f ? new DOMParser().parseFromString(f.srcdoc, 'text/html').body.innerText : ''; });
    expect(/arriving/i.test(team) && !/\[Test\]/.test(team), 'the MISMO Team email did not draw');
    noErrors(s.errs); await s.close();
  });

  /* 8. System Health: all clear with nothing stuck; red, with the bar, when a flow stops */
  await check('System Health spots a stopped flow', async () => {
    const s = await open(opts());
    let h = await s.page.evaluate(async () => (await window.__hqHealth.run()).rows.map(r => r.key + ':' + r.level));
    expect(!h.some(x => /:bad$/.test(x)), 'reported a problem with nothing wrong: ' + h.join(', '));
    await s.close();
    const store = {
      'feed-speaker-email': { doc: { requests: [{ id: 'r1', to: 'speaker@example.org', requestedAt: minsAgo(30) }] } },
      'feed-speaker-email-sent': { doc: { ids: [] } },
      'feed-speaker-reminders': { doc: { requests: [{ id: 'rem-x-2026-10-30', on: '2026-10-30', tok: 'abc', to: 'speaker@example.org' }] } },
    };
    const t = await open(opts({ store }));
    h = await t.page.evaluate(async () => (await window.__hqHealth.run()).rows.reduce((o, r) => (o[r.key] = r.level, o), {}));
    expect(h.sem === 'bad', 'a stuck speaker email was not flagged');
    expect(h.rem === 'bad', 'a missed reminder was not flagged');
    const bar = await t.page.evaluate(() => { const b = document.getElementById('hh-bar'); return b && !b.hidden ? b.innerText : ''; });
    expect(/Speaker Emails Flow/.test(bar), 'the warning bar did not show');
    noErrors(t.errs); await t.close();
  });

  /* 9. Errors are caught and logged for the team */
  await check('Errors reach the team log', async () => {
    const s = await open(opts());
    await s.page.evaluate(() => { const b = document.createElement('button'); b.id = 'zz-throw';
      b.addEventListener('click', () => { throw new Error('Deliberate test error'); }); document.body.appendChild(b); b.click(); });
    await s.page.waitForTimeout(500);
    expect((await s.page.evaluate(() => (window.__hqErrs || []).length)) > 0, 'the error was not caught');
    s.errs.length = 0;
    await s.page.clock.runFor(65000).catch(() => {});
    await s.page.waitForTimeout(2500);
    const log = s.store['feed-health-log'];
    expect(log && log.doc && log.doc.entries.some(e => /Deliberate test error/.test(e.msg)), 'the error was not written to the team log');
    await s.close();
  });

  /* 10. A file sent in from outside (the speaker form, or by email) can never run inside
         Summit HQ: a "PDF" that is really a web page is not shown, a real PDF is */
  await check('Files sent in from outside cannot run in Summit HQ', async () => {
    const b64 = x => Buffer.from(x).toString('base64');
    const store = {
      'feed-si-evtok': { doc: { bioFile: b64('<script>parent.__pwned=1;window.__pwned=1</script>'), bioFileType: 'text/html' } },
      'feed-si-oktok': { doc: { bioFile: b64('%PDF-1.4\n%sample\n'), bioFileType: 'application/pdf' } } };
    const s = await open(opts({ store }));
    await s.page.evaluate(async () => { const db = await window.claude.use('db');
      await db.doc('people/zz-evil').set({ i: 'zz-evil', n: 'Zz Evil', e: 'evil@example.org', biofile: { tok: 'evtok', name: 'bio.pdf', type: 'text/html', src: 'form' } });
      await db.doc('people/zz-good').set({ i: 'zz-good', n: 'Zz Good', e: 'good@example.org', biofile: { tok: 'oktok', name: 'bio.pdf', type: 'application/pdf', src: 'form' } }); });
    await s.page.waitForTimeout(3000); await s.page.reload(); await s.page.waitForTimeout(5000);
    await s.page.evaluate(() => window.__peopleOpen('left')); await s.page.waitForTimeout(2000);
    const review = async id => {
      await s.page.evaluate(id => document.querySelector('.pp-row[data-id="' + id + '"] .pp-hd').click(), id); await s.page.waitForTimeout(1000);
      await s.page.evaluate(id => [...document.querySelectorAll('.pp-row[data-id="' + id + '"] .se-lnk')].find(b => /Review the File/.test(b.textContent)).click(), id);
      await s.page.waitForTimeout(1800);
      const n = await s.page.evaluate(() => document.querySelectorAll('#bio-modal iframe').length);
      await s.page.evaluate(() => { const m = document.getElementById('bio-modal'); if (m) m.remove(); });
      return n;
    };
    expect(await review('zz-evil') === 0, 'a web page sent in as a PDF was shown on the page');
    expect(!(await s.page.evaluate(() => window.__pwned)), 'a file sent in from outside ran inside Summit HQ');
    expect(await review('zz-good') === 1, 'a real PDF was not shown');
    await s.close();
  });

  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n' + (results.length - failed.length) + ' of ' + results.length + ' checks passed.');
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
