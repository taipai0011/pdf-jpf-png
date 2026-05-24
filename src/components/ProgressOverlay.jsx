import { Loader2 } from 'lucide-react';

export default function ProgressOverlay({ open, progress, label }) {
  if (!open) return null;
  const pct = Math.max(0, Math.min(100, Math.round((progress ?? 0) * 100)));
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Merging files"
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(15, 13, 26, 0.32)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        aria-hidden
      />
      <div className="relative card w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-lg blur-md"
              style={{ background: 'rgba(109, 74, 255, 0.30)' }}
              aria-hidden
            />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center shadow-glow">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ink-900">Merging files</div>
            <div className="text-xs text-ink-500 truncate">{label || 'Working...'}</div>
          </div>
          <div className="ml-auto font-mono text-xs text-ink-700">{pct}%</div>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-700 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
