import { useCallback, useRef, useState } from 'react';
import { FileImage, FileText, UploadCloud } from 'lucide-react';

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
          'border border-dashed transition-all duration-300',
          hovering
            ? 'border-accent-400/60 bg-accent-500/[0.06] shadow-glow'
            : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]',
        ].join(' ')}
      >
        {/* Decorative gradient sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 0%, rgba(124,92,255,0.10), transparent 60%)',
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center px-6 py-14 sm:py-16">
          <div className="relative mb-5">
            <div
              className={[
                'absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300',
                hovering ? 'opacity-100 bg-accent-500/40' : 'opacity-50 bg-accent-500/20',
              ].join(' ')}
              aria-hidden
            />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-accent-300" strokeWidth={2} />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight gradient-text">
            Drop files to merge
          </h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md">
            Drag &amp; drop JPG, PNG or PDF files here, or click to browse. Everything
            stays in your browser.
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs text-zinc-400">
            <span className="chip">
              <FileImage className="w-3.5 h-3.5" /> JPG / PNG
            </span>
            <span className="chip">
              <FileText className="w-3.5 h-3.5" /> PDF
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
