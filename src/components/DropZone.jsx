import { useCallback, useRef, useState } from 'react';
import { FileImage, FileText, UploadCloud } from 'lucide-react';

/**
 * Drag-and-drop upload area. Light mode: faint lavender background with
 * a dashed purple border that warms up on hover.
 */
export default function DropZone({ onFiles, busy }) {
  const inputRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  const handleSelect = useCallback(
    (filesList) => {
      if (!filesList || filesList.length === 0) return;
      onFiles(filesList);
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setHovering(false);
      handleSelect(e.dataTransfer.files);
    },
    [handleSelect]
  );

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <label
        htmlFor="mergely-input"
        onDragOver={(e) => {
          e.preventDefault();
          if (!hovering) setHovering(true);
        }}
        onDragLeave={() => setHovering(false)}
        onDrop={onDrop}
        className={[
          'group relative block cursor-pointer overflow-hidden rounded-2xl',
          'transition-all duration-300',
        ].join(' ')}
        style={{
          background: hovering ? 'rgba(109, 74, 255, 0.05)' : '#faf9ff',
          border: '1.5px dashed',
          borderColor: hovering ? 'rgba(109, 74, 255, 0.55)' : 'rgba(109, 74, 255, 0.20)',
          boxShadow: hovering
            ? '0 0 0 4px rgba(109, 74, 255, 0.08), 0 12px 32px -8px rgba(109, 74, 255, 0.20)'
            : '0 1px 3px rgba(15, 13, 26, 0.03)',
        }}
      >
        {/* Decorative top sheen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 0%, rgba(109, 74, 255, 0.06), transparent 60%)',
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center px-6 py-14 sm:py-16">
          <div className="relative mb-5">
            <div
              className={[
                'absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300',
                hovering ? 'opacity-100' : 'opacity-60',
              ].join(' ')}
              style={{ background: 'rgba(109, 74, 255, 0.25)' }}
              aria-hidden
            />
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-white"
              style={{
                border: '1px solid rgba(109, 74, 255, 0.16)',
                boxShadow: '0 4px 12px rgba(109, 74, 255, 0.10)',
              }}
            >
              <UploadCloud className="w-6 h-6 text-accent-600" strokeWidth={2} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight gradient-text">
            Drop files to merge
          </h2>
          <p className="mt-2 text-sm text-ink-500 max-w-md">
            Drag &amp; drop JPG, PNG or PDF files here, or click to browse. Everything
            stays in your browser.
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="chip">
              <FileImage className="w-3.5 h-3.5 text-sky-600" /> JPG / PNG
            </span>
            <span className="chip">
              <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              inputRef.current?.click();
            }}
            disabled={busy}
            className="btn-primary mt-7"
          >
            {busy ? 'Reading...' : 'Choose files'}
          </button>
        </div>

        <input
          ref={inputRef}
          id="mergely-input"
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            handleSelect(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
