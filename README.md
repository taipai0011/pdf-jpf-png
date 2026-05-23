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
- Premium dark glassmorphism UI, fully responsive
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

The Vite `base` path is read from `VITE_BASE_PATH` so the same build works
whether you serve from the root or from a sub-path (e.g. GitHub Pages):

```bash
# Local / Vercel / Netlify (root)
npm run build

# GitHub Pages under /pdf-jpf-png/
VITE_BASE_PATH=/pdf-jpf-png/ npm run build
```

## Deployment

### GitHub Pages (configured)

This repo ships with a [GitHub Actions workflow](./.github/workflows/deploy.yml) that:

1. Installs dependencies and lints the project.
2. Builds the site with the correct `VITE_BASE_PATH` for GitHub Pages.
3. Publishes `./dist` to GitHub Pages on every push to `main`.

To enable it once after merging this PR:

1. Go to **Settings → Pages** in your repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow).
4. The site will be served at `https://<owner>.github.io/<repo>/`.

### Vercel / Netlify

Either platform works out of the box: the build command is `npm run build` and the publish directory is `dist`. No `VITE_BASE_PATH` needs to be set.

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
