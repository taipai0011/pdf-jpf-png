import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import DropZone from './DropZone.jsx';
import FileList from './FileList.jsx';
import OptionField from './OptionField.jsx';
import PrivacyBanner from './PrivacyBanner.jsx';
import ProgressOverlay from './ProgressOverlay.jsx';
import ResultList from './ResultList.jsx';
import Toast from './Toast.jsx';
import { zipResults } from '../lib/convert.js';
import { defaultOptions } from '../lib/tools.js';

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

export default function ToolView({ tool, filesApi, onBack }) {
  const { files, hydrated, busy, error, addFiles, removeFile, clearAll, reorderFiles } = filesApi;

  const [opts, setOpts] = useState(() => defaultOptions(tool));
  const [progress, setProgress] = useState({ open: false, value: 0, label: '' });
  const [results, setResults] = useState(null);
  const [runError, setRunError] = useState(null);
  const [zipping, setZipping] = useState(false);

  // Reset everything when the tool changes.
  useEffect(() => {
    setOpts(defaultOptions(tool));
    setResults(null);
    setRunError(null);
  }, [tool]);

  const { restrict, rejectMsg } = useMemo(() => {
    const acceptsPdf = tool.accept.includes('application/pdf');
    const acceptsImg = tool.accept.includes('image/');
    if (acceptsPdf && !acceptsImg) return { restrict: ['application/pdf'], rejectMsg: 'This tool needs a PDF.' };
    if (acceptsImg && !acceptsPdf) return { restrict: ['image'], rejectMsg: 'This tool takes images, not PDFs.' };
    return { restrict: undefined, rejectMsg: undefined };
  }, [tool]);

  const nextExpiryAt = useMemo(() => {
    if (files.length === 0) return null;
    return files.reduce((min, f) => Math.min(min, f.expiresAt ?? Infinity), Infinity);
  }, [files]);

  const hasFiles = files.length > 0;
  const canRun = hasFiles && hydrated;
  const Icon = tool.icon;

  const visibleFields = tool.options.filter((f) => !f.showIf || f.showIf(opts));

  function setOpt(key, value) {
    setOpts((prev) => ({ ...prev, [key]: value }));
  }

  async function run() {
    if (!canRun) return;
    setRunError(null);
    setResults(null);
    setProgress({ open: true, value: 0, label: 'Starting' });
    try {
      const out = await tool.run(files, opts, (v, l) =>
        setProgress({ open: true, value: v, label: l || '' })
      );
      setResults(out);
      // A single file downloads immediately; multiple wait for the user's pick.
      if (out.length === 1) triggerDownload(out[0].blob, out[0].filename);
    } catch (e) {
      setRunError(e.message || 'Something went wrong. Try different files.');
      setTimeout(() => setRunError(null), 5000);
    } finally {
      setProgress({ open: false, value: 0, label: '' });
    }
  }

  async function downloadZip() {
    if (!results) return;
    setZipping(true);
    try {
      const { blob, filename } = await zipResults(results, `${tool.id}.zip`);
      triggerDownload(blob, filename);
    } finally {
      setZipping(false);
    }
  }

  function startOver() {
    setResults(null);
    setRunError(null);
    clearAll();
  }

  return (
    <main className="flex-1 pb-10">
      {/* Tool header */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 dot-grid dot-grid-mask opacity-90" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] hero-radial" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-6 sm:pt-8 pb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            All tools
          </button>
          <div className="flex items-start gap-4 max-w-2xl">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 text-white shadow-glow"
              style={{ background: `linear-gradient(135deg, ${tool.accent} 0%, #4729b3 100%)` }}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={2.1} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 leading-tight">
                {tool.name}
              </h1>
              <p className="mt-1.5 text-ink-500 text-sm sm:text-base">{tool.blurb}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative pb-6">
        <PrivacyBanner nextExpiryAt={nextExpiryAt} hasFiles={hasFiles} />
      </div>

      <div className="relative">
        <DropZone
          onFiles={(list) => addFiles(list, restrict, rejectMsg)}
          busy={busy}
          title={tool.dropTitle}
          hint={tool.dropHint}
          accept={tool.accept}
          cta="Choose files"
        />
      </div>

      {hasFiles && (
        <section
          className="relative mt-8 sm:mt-10 py-8 sm:py-10 border-y"
          style={{ background: '#f0eeff', borderColor: 'rgba(109, 74, 255, 0.10)' }}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-6 lg:gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
              <FileList
                files={files}
                onRemove={removeFile}
                onReorder={reorderFiles}
                onClearAll={clearAll}
              />

              <aside className="lg:sticky lg:top-20 lg:self-start space-y-6">
                <div className="card p-5 space-y-5">
                  {visibleFields.length === 0 && (
                    <div className="text-sm text-ink-500">No settings — just run it.</div>
                  )}
                  {visibleFields.map((f, idx) => (
                    <div
                      key={f.key}
                      className={idx > 0 ? 'pt-5' : ''}
                      style={idx > 0 ? { borderTop: '1px solid rgba(109,74,255,0.10)' } : undefined}
                    >
                      <OptionField field={f} value={opts[f.key]} onChange={(v) => setOpt(f.key, v)} />
                    </div>
                  ))}
                  <div className="pt-5" style={{ borderTop: '1px solid rgba(109,74,255,0.10)' }}>
                    <button type="button" disabled={!canRun || progress.open} onClick={run} className="btn-primary w-full">
                      <Icon className="w-4 h-4" />
                      {tool.runLabel}
                    </button>
                  </div>
                </div>

                <ResultList
                  results={results}
                  onDownloadOne={(r) => triggerDownload(r.blob, r.filename)}
                  onDownloadZip={downloadZip}
                  onReset={startOver}
                  zipping={zipping}
                />
              </aside>
            </div>
          </div>
        </section>
      )}

      <Toast message={runError || error} />
      <ProgressOverlay open={progress.open} progress={progress.value} label={progress.label} />
    </main>
  );
}
