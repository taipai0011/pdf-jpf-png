import { Clock, ShieldCheck } from 'lucide-react';
import { formatRemaining, useCountdown } from '../hooks/useCountdown.js';

/**
 * Privacy banner. Always visible. When at least one file is present it
 * surfaces a live countdown to the next file's auto-deletion, so users can
 * see at a glance how long their data will live in their browser.
 */
export default function PrivacyBanner({ nextExpiryAt, hasFiles }) {
  const remaining = useCountdown(nextExpiryAt);

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <div
        className={[
          'card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-4 sm:px-5 py-3.5',
          'transition-shadow duration-300',
          hasFiles ? 'shadow-card-hover' : '',
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/70 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-ink-900 font-medium truncate">
              Files never leave your device.
            </div>
            <div className="text-xs text-ink-500 truncate">
              Stored in your browser only. Auto-deleted 1 hour after upload.
            </div>
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          {hasFiles && remaining != null ? (
            <div className="inline-flex items-center gap-2 rounded-lg bg-accent-50 border border-accent-200/70 px-3 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-accent-700" />
              <span className="text-ink-700">
                Auto-delete in{' '}
                <span className="font-mono font-semibold text-accent-700">
                  {formatRemaining(remaining)}
                </span>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg bg-ink-50 border border-ink-200 px-3 py-1.5 text-xs text-ink-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Timer starts on upload</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
