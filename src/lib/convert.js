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

import { PDFDocument } from 'pdf-lib';
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
