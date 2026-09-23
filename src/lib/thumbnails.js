/**
 * Thumbnail generation for uploaded files.
 *
 * - Images (jpg/png): downscaled to fit within MAX_THUMB on its longest side.
 * - PDFs: first page rendered at MAX_THUMB pixels on the longest side.
 *
 * Thumbnails are returned as small JPEG data URLs (~20-60 KB) suitable for
 * direct rendering in <img> tags. Storing them alongside the original blob
 * means the file list renders instantly without re-decoding originals.
 */

import { pdfjsLib } from './pdfWorker.js';

const MAX_THUMB = 320;
const THUMB_QUALITY = 0.82;

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

function fitDimensions(w, h, max) {
  const ratio = w / h;
  if (w >= h) return { w: Math.min(w, max), h: Math.min(w, max) / ratio };
  return { w: Math.min(h, max) * ratio, h: Math.min(h, max) };
}

async function imageThumbnail(blob) {
  const img = await blobToImage(blob);
  const { w, h } = fitDimensions(img.naturalWidth, img.naturalHeight, MAX_THUMB);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return {
    thumbnail: canvas.toDataURL('image/jpeg', THUMB_QUALITY),
    width: img.naturalWidth,
    height: img.naturalHeight,
    pageCount: 1,
  };
}

async function pdfThumbnail(blob) {
  const data = await blob.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = MAX_THUMB / Math.max(viewport.width, viewport.height);
  const v = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(v.width));
  canvas.height = Math.max(1, Math.floor(v.height));
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport: v }).promise;
  const result = {
    thumbnail: canvas.toDataURL('image/jpeg', THUMB_QUALITY),
    width: viewport.width,
    height: viewport.height,
    pageCount: pdf.numPages,
  };
  await pdf.destroy();
  return result;
}

export async function generateThumbnail(blob, type) {
  if (type === 'application/pdf') return pdfThumbnail(blob);
  return imageThumbnail(blob);
}

export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'application/pdf',
];

const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.pdf'];

/**
 * `restrict` optionally narrows what a specific tool will take, e.g.
 * ['image'] for image-only tools or ['application/pdf'] for PDF-only tools.
 * When omitted, any generally-supported type is accepted.
 */
export function isAccepted(file, restrict) {
  const name = file.name.toLowerCase();
  const typeOk =
    ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXT.some((e) => name.endsWith(e));
  if (!typeOk) return false;
  if (!restrict || restrict.length === 0) return true;

  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
  return restrict.some((r) => {
    if (r === 'application/pdf') return isPdf;
    if (r === 'image') return !isPdf;
    return file.type === r;
  });
}
