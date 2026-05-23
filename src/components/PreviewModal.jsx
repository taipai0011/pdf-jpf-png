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
        className="absolute inset-0 cursor-default"
        style={{
          background: 'rgba(15, 13, 26, 0.40)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      <div className="relative card w-full max-w-4xl h-full sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        <div
          className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b"
          style={{ borderColor: 'rgba(109, 74, 255, 0.10)' }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink-900 truncate">Preview</div>
            <div className="text-[11px] text-ink-500 font-mono truncate">{filename}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onDownload} className="btn-primary">
              <Download className="w-4 h-4" />
              Download {format?.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center"
          style={{ background: '#f8f7ff' }}
        >
          {previewUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={previewUrl}
              className="max-w-full h-auto rounded-lg bg-white"
              style={{
                border: '1px solid rgba(109, 74, 255, 0.10)',
                boxShadow: '0 12px 40px -12px rgba(15, 13, 26, 0.20)',
              }}
            />
          ) : (
            <div className="text-ink-500 text-sm">No preview available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
