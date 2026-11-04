/* Bio files (Amy and Jonna, 2026-11-04): a speaker can drop their bio in as a Word file,
   a PDF or a text file instead of pasting it. This reads the words out of it, in the
   browser, so they land in the bio box on the speaker form and can be read and copied in
   Summit HQ. Used by speaker.html and index.html. No outside service sees the file.
     BioText.read(fileOrBlob, name) -> Promise<string>   ('' when it cannot be read)
     BioText.kind(name, type)       -> 'docx' | 'pdf' | 'txt' | 'other'                  */
(function () {
  'use strict';
  function kind(name, type) {
    var n = String(name || '').toLowerCase(), t = String(type || '').toLowerCase();
    if (/\.docx$/.test(n) || t.indexOf('wordprocessingml') >= 0) return 'docx';
    if (/\.pdf$/.test(n) || t === 'application/pdf') return 'pdf';
    if (/\.(txt|text|md)$/.test(n) || t.indexOf('text/plain') === 0) return 'txt';
    return 'other';
  }
  function tidy(s) {
    return String(s || '').replace(/\r/g, '').replace(/[ \t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t ]{2,}/g, ' ').trim();
  }
  function entities(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); })
      .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&amp;/g, '&');
  }
  /* a Word file is a zip; the words are in word/document.xml */
  async function inflate(bytes) {
    var ds = new DecompressionStream('deflate-raw');
    var out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
    return new Uint8Array(await out.arrayBuffer());
  }
  async function docxText(buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf);
    var eocd = -1;
    for (var i = u.length - 22; i >= Math.max(0, u.length - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return '';
    var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true);
    for (var k = 0; k < count; k++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true);
      var nlen = dv.getUint16(off + 28, true), xlen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
      var local = dv.getUint32(off + 42, true);
      var name = new TextDecoder().decode(u.subarray(off + 46, off + 46 + nlen));
      if (name === 'word/document.xml') {
        var lnl = dv.getUint16(local + 26, true), lxl = dv.getUint16(local + 28, true);
        var start = local + 30 + lnl + lxl, data = u.subarray(start, start + csize);
        var raw = method === 0 ? data : await inflate(data);
        var xml = new TextDecoder().decode(raw);
        var body = xml.replace(/<w:tab\/>/g, '\t').replace(/<w:br[^>]*\/>/g, '\n').replace(/<\/w:p>/g, '\n\n').replace(/<[^>]+>/g, '');
        return tidy(entities(body));
      }
      off += 46 + nlen + xlen + clen;
    }
    return '';
  }
  /* a PDF: the reader lives in lib/ beside the page */
  var pdfjs = null;
  async function getPdfjs() {
    if (pdfjs) return pdfjs;
    var dir = 'lib/';
    var txt = async function (n) { var r = await fetch(dir + n, { cache: 'force-cache' }); if (!r.ok) throw new Error('no pdf reader'); return r.text(); };
    var both = await Promise.all([txt('pdfjs-lib.js'), txt('pdfjs-worker.js')]);
    var libUrl = URL.createObjectURL(new Blob([both[0]], { type: 'text/javascript' }));
    var wkUrl = URL.createObjectURL(new Blob([both[1]], { type: 'text/javascript' }));
    var m = await import(libUrl);
    m.GlobalWorkerOptions.workerSrc = wkUrl;
    pdfjs = m; return m;
  }
  async function pdfText(buf) {
    var lib = await getPdfjs();
    var doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
    var out = [];
    for (var i = 1; i <= Math.min(doc.numPages, 12); i++) {
      var pg = await doc.getPage(i), tc = await pg.getTextContent(), line = '';
      tc.items.forEach(function (it) { line += (it.str || ''); if (it.hasEOL) line += '\n'; else if (it.str && !/\s$/.test(it.str)) line += ' '; });
      out.push(line);
    }
    /* lines broken only by the page width join back into paragraphs */
    var t = out.join('\n\n').replace(/([^\n.!?:])\n(?=\S)/g, '$1 ').replace(/([.!?])\n(?=\S)/g, '$1\n\n');
    return tidy(t);
  }
  async function read(file, name) {
    try {
      var k = kind(name || file.name, file.type);
      var buf = await file.arrayBuffer();
      if (k === 'docx') return await docxText(buf);
      if (k === 'pdf') return await pdfText(buf);
      if (k === 'txt') return tidy(new TextDecoder().decode(buf));
      return '';
    } catch (e) { return ''; }
  }
  window.BioText = { read: read, kind: kind };
})();
