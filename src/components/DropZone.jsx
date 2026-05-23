import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

/**
 * Compact, ilovepdf-style drop zone:
 *  - Bold purple solid fill
 *  - White dashed inner border
 *  - Icon + tagline on the left, pill-shaped white "Choose files" CTA on the right
 *  - About half the height of the previous airy variant
 *  - Hovers and drag-over deepen the gradient and tighten the border
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
        className="group relative block cursor-pointer overflow-hidden rounded-2xl transition-all duration-200"
        style={{
          background: hovering
            ? 'linear-gradient(135deg, #8466ff 0%, #6d4aff 50%, #4729b3 100%)'
            : 'linear-gradient(135deg, #7c5cff 0%, #6d4aff 55%, #5a37e0 100%)',
          boxShadow: hovering
            ? '0 14px 36px -10px rgba(109,74,255,0.55), 0 6px 16px rgba(109,74,255,0.32)'
            : '0 10px 28px -10px rgba(109,74,255,0.45), 0 4px 14px rgba(109,74,255,0.28)',
        }}
      >
        {/* Soft top sheen for depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.18), transparent 70%)',
          }}
          aria-hidden
        />

        {/* Dashed inner frame */}
        <div
          className="relative m-3 sm:m-4 rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 sm:gap-6 px-5 sm:px-7 py-5 sm:py-6 transition-colors duration-200"
          style={{
            border: '2px dashed',
            borderColor: hovering ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.40)',
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0"
              style={{
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              <UploadCloud className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-white" strokeWidth={2.2} />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <div className="text-white text-base sm:text-lg font-semibold tracking-tight leading-tight">
                Drop files to merge
              </div>
              <div className="text-white/75 text-xs sm:text-sm leading-snug">
                JPG, PNG or PDF &middot; stays in your browser
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              inputRef.current?.click();
            }}
            disabled={busy}
            className="shrink-0 inline-flex items-center justify-center rounded-full bg-white px-5 sm:px-6 py-2.5 text-sm font-semibold text-accent-700 transition-all duration-200 hover:bg-white/95 active:translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 16px -4px rgba(15,13,26,0.18), 0 2px 4px rgba(15,13,26,0.10)',
            }}
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
