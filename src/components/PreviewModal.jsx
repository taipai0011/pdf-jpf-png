import { useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PreviewModal({ open, previewUrl, onClose, onDownload, filename, format }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Merge preview"
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center px-3 sm:px-6 py-4 sm:py-8"
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm cursor-default"
      />

      <div className="relative glass w-full max-w-4xl h-full sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.06]">
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-100 truncate">Preview</div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">{filename}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onDownload} className="btn-primary">
              <Download className="w-4 h-4" />
              Download {format?.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-ink-950/50 p-4 sm:p-6 flex items-start justify-center">
          {previewUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={previewUrl}
              className="max-w-full h-auto rounded-lg shadow-soft border border-white/10 bg-white"
            />
          ) : (
            <div className="text-zinc-400 text-sm">No preview available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
