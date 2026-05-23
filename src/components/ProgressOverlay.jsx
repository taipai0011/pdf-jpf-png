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
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" aria-hidden />
      <div className="relative glass w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-accent-500/30 blur-md" aria-hidden />
            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-100">Merging files</div>
            <div className="text-xs text-zinc-400 truncate">{label || 'Working...'}</div>
          </div>
          <div className="ml-auto font-mono text-xs text-zinc-300">{pct}%</div>
        </div>

        <div className="mt-4 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-600 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
