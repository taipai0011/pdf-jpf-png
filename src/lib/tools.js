/**
 * Tool registry. One entry per tool. The UI is driven entirely off this:
 * the home grid, the drop-zone copy, the options panel and the run button
 * all read from here, so adding a new tool means adding one object.
 *
 * `options` is a small declarative schema rendered by <OptionField>. Each
 * field is a segmented control unless noted. `showIf(values)` hides a field
 * when it isn't relevant to the current selection.
 */

import {
  FileImage,
  FileStack,
  Images,
  Minimize2,
  Replace,
} from 'lucide-react';

import { compressImages, convertImages, imagesToPdf, pdfToImages } from './convert.js';
import { mergeFiles } from './merge.js';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/bmp';
const PDF_TYPE = 'application/pdf';

export const TOOLS = [
  {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    tag: 'JPG / PNG / WebP → PDF',
    blurb: 'Turn a stack of photos or screenshots into a PDF — one image per page, in whatever order you drag them.',
    accent: '#6d4aff',
    icon: FileImage,
    accept: IMAGE_TYPES,
    dropTitle: 'Drop images to bundle into a PDF',
    dropHint: 'JPG, PNG or WebP · drag to set the page order',
    reorderable: true,
    runLabel: 'Build PDF',
    options: [
      {
        key: 'pageSize',
        label: 'Page size',
        default: 'fit',
        choices: [
          { value: 'fit', label: 'Match image' },
          { value: 'a4', label: 'A4' },
          { value: 'letter', label: 'Letter' },
        ],
      },
      {
        key: 'orientation',
        label: 'Orientation',
        default: 'portrait',
        showIf: (v) => v.pageSize !== 'fit',
        choices: [
          { value: 'portrait', label: 'Portrait' },
          { value: 'landscape', label: 'Landscape' },
        ],
      },
      {
        key: 'margin',
        label: 'Margin',
        default: 'none',
        showIf: (v) => v.pageSize !== 'fit',
        choices: [
          { value: 'none', label: 'None' },
          { value: 'small', label: 'Small' },
          { value: 'large', label: 'Large' },
        ],
      },
    ],
    run: imagesToPdf,
  },

  {
    id: 'pdf-to-images',
    name: 'PDF to images',
    tag: 'PDF → JPG / PNG',
    blurb: 'Pull every page of a PDF out as its own image. One page comes back as a file; several come back zipped.',
    accent: '#7c5cff',
    icon: Images,
    accept: PDF_TYPE,
    dropTitle: 'Drop a PDF to split into images',
    dropHint: 'Each page becomes a separate JPG or PNG',
    reorderable: false,
    runLabel: 'Extract pages',
    options: [
      {
        key: 'format',
        label: 'Image format',
        default: 'jpg',
        choices: [
          { value: 'jpg', label: 'JPG' },
          { value: 'png', label: 'PNG' },
        ],
      },
      {
        key: 'resolution',
        label: 'Detail',
        default: 'print',
        choices: [
          { value: 'screen', label: 'Screen' },
          { value: 'print', label: 'Sharp' },
          { value: 'high', label: 'Max' },
        ],
      },
    ],
    run: pdfToImages,
  },

  {
    id: 'convert-image',
    name: 'Change image format',
    tag: 'PNG ↔ JPG ↔ WebP',
    blurb: 'Move an image between PNG, JPG and WebP. Transparent PNGs get flattened onto a colour of your choice when they land as JPG.',
    accent: '#9b80ff',
    icon: Replace,
    accept: IMAGE_TYPES,
    dropTitle: 'Drop images to re-encode',
    dropHint: 'PNG, JPG, WebP, GIF or BMP in — your pick out',
    reorderable: false,
    runLabel: 'Convert',
    options: [
      {
        key: 'target',
        label: 'Convert to',
        default: 'png',
        choices: [
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
        ],
      },
      {
        key: 'quality',
        label: 'Quality',
        default: 0.95,
        showIf: (v) => v.target !== 'png',
        choices: [
          { value: 0.95, label: 'High' },
          { value: 0.8, label: 'Medium' },
          { value: 0.6, label: 'Small' },
        ],
      },
      {
        key: 'background',
        label: 'Flatten onto',
        default: '#ffffff',
        showIf: (v) => v.target === 'jpg',
        choices: [
          { value: '#ffffff', label: 'White' },
          { value: '#000000', label: 'Black' },
        ],
      },
    ],
    run: convertImages,
  },

  {
    id: 'compress-image',
    name: 'Shrink image size',
    tag: 'Smaller JPG / WebP',
    blurb: 'Bring a heavy photo down to a sensible file size for email or upload. You see the before-and-after size on every file.',
    accent: '#5a37e0',
    icon: Minimize2,
    accept: IMAGE_TYPES,
    dropTitle: 'Drop images to compress',
    dropHint: 'Big JPGs and PNGs come out lighter',
    reorderable: false,
    runLabel: 'Compress',
    options: [
      {
        key: 'output',
        label: 'Save as',
        default: 'jpg',
        choices: [
          { value: 'jpg', label: 'JPG' },
          { value: 'webp', label: 'WebP (smaller)' },
        ],
      },
      {
        key: 'quality',
        label: 'Quality vs size',
        default: 0.7,
        choices: [
          { value: 0.85, label: 'Keep it crisp' },
          { value: 0.7, label: 'Balanced' },
          { value: 0.5, label: 'Go small' },
        ],
      },
      {
        key: 'resize',
        label: 'Cap dimensions',
        default: 'keep',
        choices: [
          { value: 'keep', label: 'Original' },
          { value: 'large', label: '2400px' },
          { value: 'medium', label: '1600px' },
          { value: 'small', label: '1024px' },
        ],
      },
    ],
    run: compressImages,
  },

  {
    id: 'merge',
    name: 'Merge into one',
    tag: 'Stack images & PDF pages',
    blurb: 'Lay images and PDF pages onto a single sheet, stacked top-to-bottom or lined up side-by-side. Good for receipts, ID scans and long screenshots.',
    accent: '#4729b3',
    icon: FileStack,
    accept: `${IMAGE_TYPES},${PDF_TYPE}`,
    dropTitle: 'Drop files to merge into one',
    dropHint: 'JPG, PNG or PDF · drag to set the order',
    reorderable: true,
    runLabel: 'Merge & download',
    options: [
      {
        key: 'orientation',
        label: 'Direction',
        default: 'vertical',
        choices: [
          { value: 'vertical', label: 'Stacked' },
          { value: 'horizontal', label: 'Side by side' },
        ],
      },
      {
        key: 'format',
        label: 'Output',
        default: 'pdf',
        choices: [
          { value: 'pdf', label: 'PDF' },
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
        ],
      },
    ],
    // Adapter so merge shares the same run signature as the converters.
    run: async (files, opts, onProgress) => {
      const { blob, filename } = await mergeFiles(files, { ...opts, onProgress });
      return [{ blob, filename }];
    },
  },
];

export function getTool(id) {
  return TOOLS.find((t) => t.id === id) || null;
}

export function defaultOptions(tool) {
  const out = {};
  for (const f of tool.options) out[f.key] = f.default;
  return out;
}
