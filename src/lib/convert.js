/**
 * Conversion engine.
 *
 * Every function here runs entirely in the browser. Inputs are the file
 * entries kept in IndexedDB (each has a `.blob`, `.name`, `.type`); outputs
 * are plain `{ blob, filename }` results the UI can download one-by-one or
 * bundle into a zip. Nothing is ever sent anywhere.
 *
 * Progress is reported through an optional callback: onProgress(0..1, label).
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker.js';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encoding failed.'))),
      type,
      quality
    )
  );
}

function stripExt(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(0, i) : name;
}

function drawToCanvas(img, w, h, background) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/* ------------------------------------------------------------------ */
/* 1. Images -> PDF  (one image per page)                             */
/* ------------------------------------------------------------------ */

// Page presets in PDF points (1pt = 1/72 inch).
const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

const MARGINS = { none: 0, small: 36, large: 72 }; // points

/**
 * @param {'fit'|'a4'|'letter'} pageSize  'fit' = page matches each image
 * @param {'portrait'|'landscape'} orientation  (ignored when pageSize='fit')
 * @param {'none'|'small'|'large'} margin (ignored when pageSize='fit')
 */
export async function imagesToPdf(files, opts = {}, onProgress) {
  const { pageSize = 'fit', orientation = 'portrait', margin = 'none' } = opts;
  if (!files.length) throw new Error('Add at least one image first.');

  const pdf = await PDFDocument.create();
  const marginPt = MARGINS[margin] ?? 0;

  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    onProgress?.(0.05 + (i / files.length) * 0.9, `Adding ${f.name}`);

    const bytes = new Uint8Array(await f.blob.arrayBuffer());
    const isPng = f.type === 'image/png' || f.name.toLowerCase().endsWith('.png');

    let embedded;
    if (isPng) {
      // eslint-disable-next-line no-await-in-loop
      embedded = await pdf.embedPng(bytes);
    } else {
      // Re-encode anything that isn't already a clean JPEG/PNG (webp, gif, bmp)
      // through a canvas so pdf-lib can embed it.
      try {
        // eslint-disable-next-line no-await-in-loop
        embedded = await pdf.embedJpg(bytes);
      } catch {
        // eslint-disable-next-line no-await-in-loop
        const img = await blobToImage(f.blob);
        const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, '#ffffff');
        // eslint-disable-next-line no-await-in-loop
        const jpg = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        // eslint-disable-next-line no-await-in-loop
        embedded = await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      }
    }

    const iw = embedded.width;
    const ih = embedded.height;

    if (pageSize === 'fit') {
      const page = pdf.addPage([iw, ih]);
      page.drawImage(embedded, { x: 0, y: 0, width: iw, height: ih });
    } else {
      let [pw, ph] = PAGE_SIZES[pageSize];
      if (orientation === 'landscape') [pw, ph] = [ph, pw];
      const page = pdf.addPage([pw, ph]);
      const availW = pw - marginPt * 2;
      const availH = ph - marginPt * 2;
      const scale = Math.min(availW / iw, availH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      page.drawImage(embedded, {
        x: (pw - dw) / 2,
        y: (ph - dh) / 2,
        width: dw,
        height: dh,
      });
    }
  }

  onProgress?.(0.98, 'Saving PDF');
  const out = await pdf.save();
  const filename = files.length === 1 ? `${stripExt(files[0].name)}.pdf` : `images-${files.length}pages.pdf`;
  return [{ blob: new Blob([out], { type: 'application/pdf' }), filename }];
}

/* ------------------------------------------------------------------ */
/* 2. PDF -> images  (one image per page)                             */
/* ------------------------------------------------------------------ */

const SCALE_PRESET = { screen: 1.5, print: 2.5, high: 4 };

/**
 * @param {'jpg'|'png'} format
 * @param {'screen'|'print'|'high'} resolution
 */
export async function pdfToImages(files, opts = {}, onProgress) {
  const { format = 'jpg', resolution = 'print' } = opts;
  const pdfs = files.filter((f) => f.type === 'application/pdf');
  if (!pdfs.length) throw new Error('Add a PDF first.');

  const scale = SCALE_PRESET[resolution] ?? 2.5;
  const type = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const results = [];

  // Count total pages up front for smooth progress.
  let done = 0;
  let totalPages = 0;
  const docs = [];
  for (let i = 0; i < pdfs.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const data = await pdfs[i].blob.arrayBuffer();
    // eslint-disable-next-line no-await-in-loop
    const doc = await pdfjsLib.getDocument({ data }).promise;
    docs.push({ doc, name: pdfs[i].name });
    totalPages += doc.numPages;
  }

  for (const { doc, name } of docs) {
    const base = stripExt(name);
    for (let p = 1; p <= doc.numPages; p += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d');
      if (format !== 'png') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: ctx, viewport }).promise;
      // eslint-disable-next-line no-await-in-loop
      const blob = await canvasToBlob(canvas, type, 0.92);
      const suffix = doc.numPages > 1 ? `-p${String(p).padStart(2, '0')}` : '';
      results.push({ blob, filename: `${base}${suffix}.${ext}` });
      done += 1;
      onProgress?.(done / totalPages, `Rendering page ${done} of ${totalPages}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await doc.destroy();
  }

  return results;
}

/* ------------------------------------------------------------------ */
/* 3. Convert image format                                            */
/* ------------------------------------------------------------------ */

/**
 * @param {'png'|'jpg'|'webp'} target
 * @param {number} quality 0..1 (for jpg/webp)
 * @param {string} background flatten colour used when a transparent image
 *        becomes a format without alpha (jpg)
 */
export async function convertImages(files, opts = {}, onProgress) {
  const { target = 'png', quality = 0.9, background = '#ffffff' } = opts;
  const imgs = files.filter((f) => f.type !== 'application/pdf');
  if (!imgs.length) throw new Error('Add at least one image first.');

  const type = MIME[target] || 'image/png';
  const ext = target === 'jpeg' ? 'jpg' : target;
  const results = [];

  for (let i = 0; i < imgs.length; i += 1) {
    const f = imgs[i];
    onProgress?.((i + 0.5) / imgs.length, `Converting ${f.name}`);
    // eslint-disable-next-line no-await-in-loop
    const img = await blobToImage(f.blob);
    // JPEG has no alpha, so flatten onto the chosen background.
    const bg = target === 'jpg' ? background : null;
    const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight, bg);
    // eslint-disable-next-line no-await-in-loop
    const blob = await canvasToBlob(canvas, type, quality);
    results.push({ blob, filename: `${stripExt(f.name)}.${ext}` });
  }

  onProgress?.(1, 'Done');
  return results;
}

/* ------------------------------------------------------------------ */
/* 4. Compress image                                                  */
/* ------------------------------------------------------------------ */

const MAXDIM = { keep: Infinity, large: 2400, medium: 1600, small: 1024 };

/**
 * @param {'jpg'|'webp'} output  webp is smaller; jpg is universally supported
 * @param {number} quality 0..1
 * @param {'keep'|'large'|'medium'|'small'} resize longest-side cap in px
 */
export async function compressImages(files, opts = {}, onProgress) {
  const { output = 'jpg', quality = 0.7, resize = 'keep' } = opts;
  const imgs = files.filter((f) => f.type !== 'application/pdf');
  if (!imgs.length) throw new Error('Add at least one image first.');

  const type = output === 'webp' ? 'image/webp' : 'image/jpeg';
  const ext = output === 'webp' ? 'webp' : 'jpg';
  const cap = MAXDIM[resize] ?? Infinity;
  const results = [];

  for (let i = 0; i < imgs.length; i += 1) {
    const f = imgs[i];
    onProgress?.((i + 0.5) / imgs.length, `Compressing ${f.name}`);
    // eslint-disable-next-line no-await-in-loop
    const img = await blobToImage(f.blob);
    let { naturalWidth: w, naturalHeight: h } = img;
    const longest = Math.max(w, h);
    if (longest > cap) {
      const s = cap / longest;
      w *= s;
      h *= s;
    }
    const canvas = drawToCanvas(img, w, h, output === 'webp' ? null : '#ffffff');
    // eslint-disable-next-line no-await-in-loop
    const blob = await canvasToBlob(canvas, type, quality);
    results.push({
      blob,
      filename: `${stripExt(f.name)}-compressed.${ext}`,
      before: f.size,
      after: blob.size,
    });
  }

  onProgress?.(1, 'Done');
  return results;
}

/* ------------------------------------------------------------------ */
/* Zip bundling (used when a run produces more than one file)         */
/* ------------------------------------------------------------------ */

export async function zipResults(results, zipName = 'files.zip', onProgress) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const seen = new Map();
  for (const r of results) {
    // Guard against duplicate filenames inside the archive.
    let name = r.filename;
    if (seen.has(name)) {
      const n = seen.get(name) + 1;
      seen.set(name, n);
      const dot = name.lastIndexOf('.');
      name = dot > 0 ? `${name.slice(0, dot)}-${n}${name.slice(dot)}` : `${name}-${n}`;
    } else {
      seen.set(name, 1);
    }
    zip.file(name, r.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' }, (meta) =>
    onProgress?.(meta.percent / 100, 'Zipping')
  );
  return { blob, filename: zipName };
}

/* ------------------------------------------------------------------ */
/* 5. PDF page-range parsing (shared by split)                        */
/* ------------------------------------------------------------------ */

/**
 * "1-3, 5, 8-10" -> [1,2,3,5,8,9,10] (1-based, clamped to n, sorted, unique).
 * Empty / blank means "all pages".
 */
export function parseRanges(str, n) {
  if (!str || !str.trim()) return Array.from({ length: n }, (_, i) => i + 1);
  const out = new Set();
  for (const part of str.split(',')) {
    const s = part.trim();
    if (!s) continue;
    const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = +m[1];
      let b = +m[2];
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i += 1) if (i >= 1 && i <= n) out.add(i);
    } else if (/^\d+$/.test(s)) {
      const i = +s;
      if (i >= 1 && i <= n) out.add(i);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/* 6. Combine PDFs (page-preserving, keeps text & vectors)            */
/* ------------------------------------------------------------------ */

export async function mergePdfs(files, _opts = {}, onProgress) {
  const pdfs = files.filter((f) => f.type === 'application/pdf');
  if (pdfs.length < 1) throw new Error('Add at least one PDF.');

  const out = await PDFDocument.create();
  for (let i = 0; i < pdfs.length; i += 1) {
    onProgress?.((i + 0.5) / pdfs.length, `Adding ${pdfs[i].name}`);
    // eslint-disable-next-line no-await-in-loop
    const src = await PDFDocument.load(await pdfs[i].blob.arrayBuffer());
    // eslint-disable-next-line no-await-in-loop
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  onProgress?.(0.98, 'Saving');
  const bytes = await out.save();
  return [{ blob: new Blob([bytes], { type: 'application/pdf' }), filename: 'combined.pdf' }];
}

/* ------------------------------------------------------------------ */
/* 7. Split PDF (extract a range, or burst every page)               */
/* ------------------------------------------------------------------ */

/**
 * @param {'extract'|'burst'} mode
 * @param {string} pages  page ranges for 'extract' (blank = all)
 */
export async function splitPdf(files, opts = {}, onProgress) {
  const { mode = 'extract', pages = '' } = opts;
  const pdfs = files.filter((f) => f.type === 'application/pdf');
  if (!pdfs.length) throw new Error('Add a PDF first.');

  const results = [];
  for (let fi = 0; fi < pdfs.length; fi += 1) {
    const f = pdfs[fi];
    const base = stripExt(f.name);
    // eslint-disable-next-line no-await-in-loop
    const src = await PDFDocument.load(await f.blob.arrayBuffer());
    const n = src.getPageCount();
    const wanted = parseRanges(pages, n); // 1-based

    if (mode === 'burst') {
      for (let k = 0; k < wanted.length; k += 1) {
        const idx = wanted[k] - 1;
        // eslint-disable-next-line no-await-in-loop
        const one = await PDFDocument.create();
        // eslint-disable-next-line no-await-in-loop
        const [pg] = await one.copyPages(src, [idx]);
        one.addPage(pg);
        // eslint-disable-next-line no-await-in-loop
        const bytes = await one.save();
        results.push({
          blob: new Blob([bytes], { type: 'application/pdf' }),
          filename: `${base}-p${String(wanted[k]).padStart(2, '0')}.pdf`,
        });
        onProgress?.((k + 1) / wanted.length, `Page ${k + 1} of ${wanted.length}`);
      }
    } else {
      const out = await PDFDocument.create();
      const idxs = wanted.map((p) => p - 1);
      // eslint-disable-next-line no-await-in-loop
      const pgs = await out.copyPages(src, idxs);
      pgs.forEach((p) => out.addPage(p));
      // eslint-disable-next-line no-await-in-loop
      const bytes = await out.save();
      results.push({
        blob: new Blob([bytes], { type: 'application/pdf' }),
        filename: `${base}-extract.pdf`,
      });
      onProgress?.((fi + 1) / pdfs.length, `Extracting ${f.name}`);
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* 8. Rotate PDF (all pages, in 90-degree steps)                     */
/* ------------------------------------------------------------------ */

/** @param {90|180|270} angle clockwise */
export async function rotatePdf(files, opts = {}, onProgress) {
  const { angle = 90 } = opts;
  const pdfs = files.filter((f) => f.type === 'application/pdf');
  if (!pdfs.length) throw new Error('Add a PDF first.');

  const results = [];
  for (let i = 0; i < pdfs.length; i += 1) {
    const f = pdfs[i];
    onProgress?.((i + 0.5) / pdfs.length, `Rotating ${f.name}`);
    // eslint-disable-next-line no-await-in-loop
    const doc = await PDFDocument.load(await f.blob.arrayBuffer());
    doc.getPages().forEach((p) => {
      const current = p.getRotation().angle || 0;
      p.setRotation(degrees((current + Number(angle)) % 360));
    });
    // eslint-disable-next-line no-await-in-loop
    const bytes = await doc.save();
    results.push({
      blob: new Blob([bytes], { type: 'application/pdf' }),
      filename: `${stripExt(f.name)}-rotated.pdf`,
    });
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* 9. Compress PDF (re-raster pages at reduced quality)              */
/* ------------------------------------------------------------------ */

const PDF_COMPRESS = {
  light: { scale: 2, quality: 0.7 },
  medium: { scale: 1.5, quality: 0.6 },
  strong: { scale: 1.1, quality: 0.5 },
};

/**
 * Rebuilds each page as a flattened JPEG image inside a fresh PDF. This drops
 * size a lot on scan-heavy or image-heavy PDFs, but the pages become images
 * (text stops being selectable) — that trade-off is the whole point.
 * @param {'light'|'medium'|'strong'} level
 */
export async function compressPdf(files, opts = {}, onProgress) {
  const { level = 'medium' } = opts;
  const { scale, quality } = PDF_COMPRESS[level] || PDF_COMPRESS.medium;
  const pdfs = files.filter((f) => f.type === 'application/pdf');
  if (!pdfs.length) throw new Error('Add a PDF first.');

  const results = [];
  for (let fi = 0; fi < pdfs.length; fi += 1) {
    const f = pdfs[fi];
    // eslint-disable-next-line no-await-in-loop
    const data = await f.blob.arrayBuffer();
    // eslint-disable-next-line no-await-in-loop
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const out = await PDFDocument.create();

    for (let p = 1; p <= doc.numPages; p += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(p);
      const ptView = page.getViewport({ scale: 1 }); // page size in PDF points
      const rView = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(rView.width));
      canvas.height = Math.max(1, Math.floor(rView.height));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: ctx, viewport: rView }).promise;
      // eslint-disable-next-line no-await-in-loop
      const jpg = await canvasToBlob(canvas, 'image/jpeg', quality);
      // eslint-disable-next-line no-await-in-loop
      const img = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      const pg = out.addPage([ptView.width, ptView.height]);
      pg.drawImage(img, { x: 0, y: 0, width: ptView.width, height: ptView.height });
      onProgress?.((p / doc.numPages), `Page ${p} of ${doc.numPages}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await doc.destroy();
    // eslint-disable-next-line no-await-in-loop
    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    results.push({
      blob,
      filename: `${stripExt(f.name)}-compressed.pdf`,
      before: f.size,
      after: blob.size,
    });
  }
  return results;
}
