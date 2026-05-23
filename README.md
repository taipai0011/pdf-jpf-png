# Mergely

A privacy-first, fully client-side merger for **JPG**, **PNG** and **PDF** files. Combine multiple files into a single PDF (or image) — horizontally or vertically — without ever uploading anything to a server.

> Files are stored in your browser only and **auto-delete one hour after upload**.

## Features

- Drag-and-drop multiple JPG / PNG / PDF files
- Live thumbnail previews (PDF first page is rendered locally)
- Reorder files via drag, remove individually, or clear all
- Two layouts: **horizontal** (side-by-side) and **vertical** (stacked)
- Choose output format: **PDF**, **PNG**, or **JPG**
- Preview the merged result before downloading
- IndexedDB-backed local storage with a visible 1-hour countdown
- Premium light theme inspired by ilovepdf + Linear / Vercel polish, fully responsive
- 100% client-side — no server, no uploads, no tracking

## Tech stack

- **React 18** + **Vite** for a fast SPA
- **Tailwind CSS** for the design system
- **pdf-lib** for assembling the output PDF
- **pdfjs-dist** for rendering PDF pages to canvas
- **@dnd-kit** for accessible drag-and-drop reordering
- **idb** for IndexedDB access with a small key/value-style API
- **lucide-react** for icons

## Getting started

Requirements: **Node.js 18+** and **npm**.

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev

# Type-check / lint
npm run lint

# Production build (outputs to ./dist)
npm run build

# Preview the production build locally
npm run preview
```

### Environment

The Vite `base` path defaults to `/`, which is what Vercel (and most hosts)
serve from. If you ever need to host under a sub-path you can override it:

```bash
VITE_BASE_PATH=/some-subpath/ npm run build
```

## Deployment

### Vercel (production)

The repo is connected to Vercel, which auto-deploys:

- **Production** on every push to `main`
- **Preview** for every pull request

No configuration is required — Vercel auto-detects the Vite build (`npm run build`, output in `./dist`).

### CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs `npm install`, lint, and `npm run build` on every push and pull request. It does not deploy anywhere — Vercel handles that.

### Other static hosts

The site is a fully static SPA. To host elsewhere (Netlify, Cloudflare Pages, GitHub Pages, S3, etc.):

```bash
npm install
npm run build      # outputs to ./dist
# upload the contents of ./dist to your host
```

For sub-path hosting (e.g. GitHub Pages under `/pdf-jpf-png/`), pass `VITE_BASE_PATH=/pdf-jpf-png/` to the build.

## How merging works

1. Each input file is expanded into one or more canvases — one per image, one per page for PDFs (rendered at 2× via pdfjs-dist).
2. Canvases are tiled side-by-side (horizontal) or stacked (vertical), normalized to a common edge length so the strip looks consistent.
3. The composed canvas is encoded as a JPEG and either embedded into a single-page PDF (via pdf-lib) or returned as a PNG/JPEG.
4. The output is delivered as a Blob for download — never uploaded anywhere.

The composed canvas is capped at 6000 px on its longest side to keep memory usage reasonable.

## Privacy model

- All file bytes live in **IndexedDB** (`mergely / files`) on your device.
- Every entry stores an `expiresAt` timestamp set to **1 hour after upload**.
- Expired entries are purged on app load, every 30 seconds while the tab is open, and whenever the tab regains focus.
- The privacy banner shows a live countdown to the next file's expiry.
- Clearing your browser's site data also wipes everything immediately.

## Project structure

```
src/
  App.jsx                 # Top-level layout & state orchestration
  main.jsx                # React entry point
  index.css               # Tailwind directives + design tokens
  components/             # UI components (Header, DropZone, FileList, ...)
  hooks/
    useFiles.js           # File list state + IndexedDB sync
    useCountdown.js       # Live countdown helper
  lib/
    storage.js            # IndexedDB wrapper with auto-expiry
    thumbnails.js         # Thumbnail generation (images + PDFs)
    pdfWorker.js          # pdfjs-dist worker setup
    merge.js              # Merge engine (canvas composition + PDF output)
```

## License

MIT
