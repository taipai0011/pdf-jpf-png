import { Clock, ShieldCheck } from 'lucide-react';
import { formatRemaining, useCountdown } from '../hooks/useCountdown.js';

/**
 * The privacy banner. Always visible. When at least one file is present it
 * surfaces a live countdown to the next file's auto-deletion, so users can
 * see at a glance how long their data will live in their browser.
 */
export default function PrivacyBanner({ nextExpiryAt, hasFiles }) {
  const remaining = useCountdown(nextExpiryAt);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div
        className={[
          'glass flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-4 sm:px-5 py-3.5',
          'transition-colors duration-300',
          hasFiles ? 'border-accent-500/25' : '',
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-400/10 border border-emerald-400/20 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">
              Files never leave your device.
            </div>
            <div className="text-xs text-zinc-400 truncate">
              Stored in your browser only. Auto-deleted 1 hour after upload.
            </div>
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          {hasFiles && remaining != null ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-accent-500/10 border border-accent-400/25 px-3 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-accent-300" />
              <span className="text-zinc-300">
                Auto-delete in{' '}
                <span className="font-mono font-medium text-accent-200">
                  {formatRemaining(remaining)}
                </span>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-1.5 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Timer starts on upload</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
