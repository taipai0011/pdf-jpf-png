/**
 * Configures pdfjs-dist's worker.
 *
 * Vite resolves the worker file as a static asset URL using the `?url`
 * suffix, which is the recommended pattern. Importing this module once
 * (at app entry or first use) is enough; subsequent imports are cheap.
 */

import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export { pdfjsLib };
