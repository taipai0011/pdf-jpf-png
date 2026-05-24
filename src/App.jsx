import { useEffect, useMemo, useState } from 'react';
import DropZone from './components/DropZone.jsx';
import FileList from './components/FileList.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import MergeOptions from './components/MergeOptions.jsx';
import PreviewModal from './components/PreviewModal.jsx';
import PrivacyBanner from './components/PrivacyBanner.jsx';
import ProgressOverlay from './components/ProgressOverlay.jsx';
import Toast from './components/Toast.jsx';
import { useFiles } from './hooks/useFiles.js';
import { mergeFiles } from './lib/merge.js';

export default function App() {
  const { files, hydrated, busy, error, addFiles, removeFile, clearAll, reorderFiles } = useFiles();

  const [orientation, setOrientation] = useState('vertical');
  const [format, setFormat] = useState('pdf');

  const [progress, setProgress] = useState({ open: false, value: 0, label: '' });
  const [preview, setPreview] = useState({ open: false, blob: null, url: null, filename: '' });

  // Compute the next expiry timestamp from the file list (no extra IO).
  const nextExpiryAt = useMemo(() => {
    if (files.length === 0) return null;
    return files.reduce((min, f) => Math.min(min, f.expiresAt ?? Infinity), Infinity);
  }, [files]);

  // Revoke preview object URLs to avoid leaks.
  useEffect(
    () => () => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    },
    [preview.url]
  );

  const canMerge = files.length >= 1 && hydrated;
  const hasFiles = files.length > 0;

  async function runMerge({ openPreview }) {
    if (!canMerge) return;
    setProgress({ open: true, value: 0, label: 'Starting...' });
    try {
      const { blob, filename, previewUrl } = await mergeFiles(files, {
        orientation,
        format,
        onProgress: (v, l) => setProgress({ open: true, value: v, label: l }),
      });

      if (preview.url) URL.revokeObjectURL(preview.url);

      if (openPreview) {
        setPreview({ open: true, blob, url: previewUrl, filename });
      } else {
        triggerDownload(blob, filename);
        URL.revokeObjectURL(previewUrl);
        setPreview({ open: false, blob: null, url: null, filename: '' });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      // eslint-disable-next-line no-alert
      alert(`Merge failed: ${e.message || e}`);
    } finally {
      setProgress({ open: false, value: 0, label: '' });
    }
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 pb-10">
        {/* HERO — dot grid + radial glow on the canvas background */}
        <section className="relative overflow-hidden">
          {/* Dot-grid (faded toward edges) */}
          <div
            className="pointer-events-none absolute inset-0 dot-grid dot-grid-mask opacity-90"
            aria-hidden
          />
          {/* Soft purple radial behind the heading */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] hero-radial" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-10 sm:pt-14 pb-8 sm:pb-12">
            <div className="max-w-2xl">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-accent-700 uppercase tracking-[0.16em]"
                style={{
                  border: '1px solid rgba(109, 74, 255, 0.16)',
                  boxShadow: '0 1px 2px rgba(15, 13, 26, 0.04)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                Free &middot; private &middot; client-side
              </span>
              <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight gradient-text leading-[1.05]">
                Merge images &amp; PDFs,
                <br className="hidden sm:block" /> privately.
              </h1>
              <p className="mt-4 text-ink-500 text-base sm:text-lg max-w-xl">
                Combine JPGs, PNGs and PDFs into a single document or image &mdash;
                horizontally or vertically. Files stay in your browser and disappear
                automatically after one hour.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy banner sits between hero and dropzone, on canvas bg */}
        <div className="relative pb-6">
          <PrivacyBanner nextExpiryAt={nextExpiryAt} hasFiles={hasFiles} />
        </div>

        {/* Drop zone — still on canvas */}
        <div className="relative">
          <DropZone onFiles={addFiles} busy={busy} />
        </div>

        {/* Workspace band — wash background, alternates from canvas */}
        {hasFiles && (
          <section
            className="relative mt-8 sm:mt-10 py-8 sm:py-10 border-y"
            style={{
              background: '#f0eeff',
              borderColor: 'rgba(109, 74, 255, 0.10)',
            }}
          >
            <div className="space-y-6 sm:space-y-7">
              <FileList
                files={files}
                onRemove={removeFile}
                onReorder={reorderFiles}
                onClearAll={clearAll}
              />
              <MergeOptions
                orientation={orientation}
                setOrientation={setOrientation}
                format={format}
                setFormat={setFormat}
                canMerge={canMerge}
                busy={progress.open}
                onPreview={() => runMerge({ openPreview: true })}
                onMerge={() => runMerge({ openPreview: false })}
              />
            </div>
          </section>
        )}
      </main>

      <Footer />

      <Toast message={error} />
      <ProgressOverlay open={progress.open} progress={progress.value} label={progress.label} />
      <PreviewModal
        open={preview.open}
        previewUrl={preview.url}
        filename={preview.filename}
        format={format}
        onClose={() => {
          if (preview.url) URL.revokeObjectURL(preview.url);
          setPreview({ open: false, blob: null, url: null, filename: '' });
        }}
        onDownload={() => {
          if (preview.blob) triggerDownload(preview.blob, preview.filename);
        }}
      />
    </div>
  );
}
