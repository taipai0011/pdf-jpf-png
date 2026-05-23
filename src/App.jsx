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

  async function runMerge({ openPreview }) {
    if (!canMerge) return;
    setProgress({ open: true, value: 0, label: 'Starting...' });
    try {
      const { blob, filename, previewUrl } = await mergeFiles(files, {
        orientation,
        format,
        onProgress: (v, l) => setProgress({ open: true, value: v, label: l }),
      });

      // Revoke previous preview URL if any.
      if (preview.url) URL.revokeObjectURL(preview.url);

      if (openPreview) {
        setPreview({ open: true, blob, url: previewUrl, filename });
      } else {
        triggerDownload(blob, filename);
        // Free the preview URL since we won't show it.
        URL.revokeObjectURL(previewUrl);
        setPreview({ open: false, blob: null, url: null, filename: '' });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      // Surface error briefly via window alert; in a fuller app we'd
      // route this through the Toast component.
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
    // Defer revoke slightly so the browser has a chance to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 space-y-6 sm:space-y-7 pb-10">
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-2 sm:pt-3">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight gradient-text">
              Merge images &amp; PDFs, privately.
            </h1>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base max-w-xl">
              Combine JPGs, PNGs and PDFs into a single document or image &mdash;
              horizontally or vertically. Files stay in your browser and disappear
              automatically after one hour.
            </p>
          </div>
        </section>

        <PrivacyBanner nextExpiryAt={nextExpiryAt} hasFiles={files.length > 0} />

        <DropZone onFiles={addFiles} busy={busy} />

        <FileList
          files={files}
          onRemove={removeFile}
          onReorder={reorderFiles}
          onClearAll={clearAll}
        />

        {files.length > 0 && (
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
