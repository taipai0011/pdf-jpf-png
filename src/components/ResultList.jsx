import { CheckCircle2, Download, FileDown, RotateCcw } from 'lucide-react';

function fmtSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Shows the output of a run. One result downloads directly; several offer a
 * "Download all (zip)" button plus individual links. Compression results
 * also show the size they saved.
 */
export default function ResultList({ results, onDownloadOne, onDownloadZip, onReset, zipping }) {
  if (!results || results.length === 0) return null;

  const totalBefore = results.reduce((s, r) => s + (r.before || 0), 0);
  const totalAfter = results.reduce((s, r) => s + (r.after || 0), 0);
  const showSavings = totalBefore > 0 && totalAfter > 0;
  const savedPct = showSavings ? Math.max(0, Math.round((1 - totalAfter / totalBefore) * 100)) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" strokeWidth={2.2} />
          <span className="text-sm font-semibold text-ink-900">
            {results.length === 1 ? 'Your file is ready' : `${results.length} files ready`}
          </span>
        </div>
        <button type="button" onClick={onReset} className="text-xs text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
          Start over
        </button>
      </div>

      {showSavings && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-xs text-emerald-800">
          {fmtSize(totalBefore)} down to {fmtSize(totalAfter)} — {savedPct}% smaller
        </div>
      )}

      <ul className="space-y-1.5 max-h-64 overflow-auto no-scrollbar">
        {results.map((r, i) => (
          <li
            key={`${r.filename}-${i}`}
            className="flex items-center gap-3 rounded-lg bg-white px-3 py-2"
            style={{ border: '1px solid rgba(109,74,255,0.10)' }}
          >
            <span className="min-w-0 flex-1 text-sm text-ink-800 truncate">{r.filename}</span>
            {r.after != null && (
              <span className="shrink-0 text-[11px] font-mono text-ink-500">{fmtSize(r.after)}</span>
            )}
            <button
              type="button"
              onClick={() => onDownloadOne(r)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-accent-700 hover:bg-accent-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </button>
          </li>
        ))}
      </ul>

      {results.length > 1 && (
        <button type="button" onClick={onDownloadZip} disabled={zipping} className="btn-primary w-full mt-4">
          <FileDown className="w-4 h-4" />
          {zipping ? 'Preparing zip' : 'Download all (zip)'}
        </button>
      )}
    </div>
  );
}
