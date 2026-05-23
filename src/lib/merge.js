/**
 * Merge engine.
 *
 * Pipeline:
 *   1. Each input file is expanded into a list of "items" (one per
 *      image; one per page for PDFs). Each item becomes a high-resolution
 *      canvas.
 *   2. Items are tiled either horizontally (side-by-side, normalized to
 *      common height) or vertically (stacked, normalized to common width).
 *   3. The composed canvas is encoded as a JPEG and embedded into a single
 *      page of a new PDF using pdf-lib. Optionally the same composed image
 *      can be returned as a PNG/JPEG download.
 *
 * Progress is reported through a callback so the UI can show a smooth
 * progress bar during long merges.
 */

import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker.js';

const MAX_DIMENSION = 6000; // hard cap on output canvas longest side
const RENDER_SCALE_PDF = 2; // render PDFs at 2x for crisp output

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

async function imageToCanvas(blob) {
  const img = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return [canvas];
}

async function pdfToCanvases(blob) {
  const data = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const canvases = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE_PDF });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
  }
  await pdf.destroy();
  return canvases;
}

async function fileToCanvases(file) {
  if (file.type === 'application/pdf') return pdfToCanvases(file.blob);
  return imageToCanvas(file.blob);
}

/**
 * Compose a list of canvases into a single canvas, side-by-side (horizontal)
 * or stacked (vertical), with a uniform gap between items.
 */
function composeCanvases(canvases, orientation, options = {}) {
  const gap = options.gap ?? 24;
  const background = options.background ?? '#ffffff';

  let totalW = 0;
  let totalH = 0;
  let scale = 1;
  let layout;

  if (orientation === 'horizontal') {
    // Normalize each canvas to a common target height, sum widths.
    const targetH = Math.min(MAX_DIMENSION, Math.max(...canvases.map((c) => c.height)));
    layout = canvases.map((c) => {
      const w = (c.width * targetH) / c.height;
      return { w, h: targetH };
    });
    const rawW = layout.reduce((s, l) => s + l.w, 0) + gap * (canvases.length - 1);
    if (rawW > MAX_DIMENSION) {
      scale = MAX_DIMENSION / rawW;
    }
    totalW = rawW * scale;
    totalH = targetH * scale;
  } else {
    // Vertical: normalize widths.
    const targetW = Math.min(MAX_DIMENSION, Math.max(...canvases.map((c) => c.width)));
    layout = canvases.map((c) => {
      const h = (c.height * targetW) / c.width;
      return { w: targetW, h };
    });
    const rawH = layout.reduce((s, l) => s + l.h, 0) + gap * (canvases.length - 1);
    if (rawH > MAX_DIMENSION) {
      scale = MAX_DIMENSION / rawH;
    }
    totalW = targetW * scale;
    totalH = rawH * scale;
  }

  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.floor(totalW));
  out.height = Math.max(1, Math.floor(totalH));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, out.width, out.height);

  if (orientation === 'horizontal') {
    let x = 0;
    for (let i = 0; i < canvases.length; i += 1) {
      const w = layout[i].w * scale;
      const h = layout[i].h * scale;
      ctx.drawImage(canvases[i], x, 0, w, h);
      x += w + gap * scale;
    }
  } else {
    let y = 0;
    for (let i = 0; i < canvases.length; i += 1) {
      const w = layout[i].w * scale;
      const h = layout[i].h * scale;
      ctx.drawImage(canvases[i], 0, y, w, h);
      y += h + gap * scale;
    }
  }

  return out;
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Encode a composed canvas as a single-page PDF using pdf-lib. The PDF page
 * size matches the canvas dimensions (1 pixel = 1 point) so the output
 * preserves the source resolution at 100% zoom.
 */
async function canvasToPdfBlob(canvas) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Mergely Output');
  pdfDoc.setProducer('Mergely');
  pdfDoc.setCreator('Mergely');
  pdfDoc.setCreationDate(new Date());

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const image = await pdfDoc.embedJpg(jpegBytes);

  const page = pdfDoc.addPage([canvas.width, canvas.height]);
  page.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height });

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Top-level merge function.
 *
 * @param {Array} files - file entries from storage
 * @param {Object} options
 * @param {'horizontal'|'vertical'} options.orientation
 * @param {'pdf'|'png'|'jpg'} options.format
 * @param {(progress: number, label: string) => void} [options.onProgress]
 * @returns {Promise<{blob: Blob, filename: string, previewUrl: string}>}
 */
export async function mergeFiles(files, options) {
  const { orientation = 'vertical', format = 'pdf', onProgress } = options || {};
  const report = (p, l) => onProgress && onProgress(p, l);

  if (!files || files.length === 0) {
    throw new Error('No files to merge.');
  }

  report(0.02, 'Preparing files...');

  // Expand each file into one or more canvases.
  const canvases = [];
  for (let i = 0; i < files.length; i += 1) {
    const f = files[i];
    report(0.05 + (i / files.length) * 0.55, `Processing "${f.name}"...`);
    // eslint-disable-next-line no-await-in-loop
    const out = await fileToCanvases(f);
    canvases.push(...out);
  }

  report(0.65, 'Composing layout...');
  const composed = composeCanvases(canvases, orientation);

  report(0.82, 'Encoding output...');
  let blob;
  let extension;
  if (format === 'pdf') {
    blob = await canvasToPdfBlob(composed);
    extension = 'pdf';
  } else if (format === 'png') {
    blob = await canvasToBlob(composed, 'image/png');
    extension = 'png';
  } else {
    blob = await canvasToBlob(composed, 'image/jpeg', 0.92);
    extension = 'jpg';
  }

  // Build a friendly filename: mergely-<orientation>-YYYYMMDD-HHmmss.<ext>
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `mergely-${orientation}-${stamp}.${extension}`;

  // Always provide a preview-friendly image URL too; for PDFs we re-encode
  // the composed canvas as a PNG so the preview modal can show it directly.
  const previewBlob = format === 'pdf' ? await canvasToBlob(composed, 'image/jpeg', 0.9) : blob;
  const previewUrl = URL.createObjectURL(previewBlob);

  report(1, 'Done');

  return { blob, filename, previewUrl };
}
