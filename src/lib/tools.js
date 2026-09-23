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
  Combine,
  FileArchive,
  FileImage,
  FileStack,
  Images,
  Minimize2,
  Replace,
  RotateCw,
  Scissors,
} from 'lucide-react';

import {
  compressImages,
  compressPdf,
  convertImages,
  imagesToPdf,
  mergePdfs,
  pdfToImages,
  rotatePdf,
  splitPdf,
} from './convert.js';
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
    id: 'merge-pdf',
    name: 'Combine PDFs',
    tag: 'Many PDFs → one',
    blurb: 'Join several PDFs into a single file, in the order you drag them. Text and pages stay intact — nothing gets flattened into an image.',
    accent: '#6d4aff',
    icon: Combine,
    accept: PDF_TYPE,
    dropTitle: 'Drop PDFs to join together',
    dropHint: 'Drag to set which file comes first',
    reorderable: true,
    runLabel: 'Combine into one PDF',
    options: [],
    run: mergePdfs,
  },

  {
    id: 'split-pdf',
    name: 'Split a PDF',
    tag: 'Pull pages out',
    blurb: 'Keep only the pages you want as one new PDF, or burst every page into its own file. Leave the range blank to take all pages.',
    accent: '#7c5cff',
    icon: Scissors,
    accept: PDF_TYPE,
    dropTitle: 'Drop a PDF to split',
    dropHint: 'Extract a page range or break it apart',
    reorderable: false,
    runLabel: 'Split PDF',
    options: [
      {
        key: 'mode',
        label: 'What to do',
        default: 'extract',
        choices: [
          { value: 'extract', label: 'Keep chosen pages' },
          { value: 'burst', label: 'Every page separate' },
        ],
      },
      {
        key: 'pages',
        label: 'Pages',
        type: 'text',
        default: '',
        placeholder: 'e.g. 1-3, 5, 8-10',
        hint: 'Leave blank for all pages',
      },
    ],
    run: splitPdf,
  },

  {
    id: 'rotate-pdf',
    name: 'Rotate a PDF',
    tag: 'Fix sideways pages',
    blurb: 'Turn every page of a PDF the same way — handy when a scan came out sideways or upside down.',
    accent: '#9b80ff',
    icon: RotateCw,
    accept: PDF_TYPE,
    dropTitle: 'Drop a PDF to rotate',
    dropHint: 'All pages turn the same direction',
    reorderable: false,
    runLabel: 'Rotate PDF',
    options: [
      {
        key: 'angle',
        label: 'Turn clockwise by',
        default: 90,
        choices: [
          { value: 90, label: '90°' },
          { value: 180, label: '180°' },
          { value: 270, label: '270°' },
        ],
      },
    ],
    run: rotatePdf,
  },

  {
    id: 'compress-pdf',
    name: 'Shrink a PDF',
    tag: 'Smaller file size',
    blurb: 'Bring a heavy PDF down to an emailable size. Pages get re-saved as compressed images, so the text stops being selectable — pick how hard to squeeze.',
    accent: '#5a37e0',
    icon: FileArchive,
    accept: PDF_TYPE,
    dropTitle: 'Drop a PDF to compress',
    dropHint: 'Best on scans and image-heavy files',
    reorderable: false,
    runLabel: 'Compress PDF',
    options: [
      {
        key: 'level',
        label: 'How hard to squeeze',
        default: 'medium',
        choices: [
          { value: 'light', label: 'Light' },
          { value: 'medium', label: 'Balanced' },
          { value: 'strong', label: 'Smallest' },
        ],
      },
    ],
    run: compressPdf,
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
