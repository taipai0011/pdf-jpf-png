import { useEffect, useState } from 'react';

/**
 * Returns the remaining time (in ms) until `target` (a timestamp in ms),
 * updated every `intervalMs`. When `target` is null the hook returns null.
 */
export function useCountdown(target, intervalMs = 1000) {
  const [remaining, setRemaining] = useState(() => (target ? Math.max(0, target - Date.now()) : null));

  useEffect(() => {
    if (target == null) {
      setRemaining(null);
      return undefined;
    }
    setRemaining(Math.max(0, target - Date.now()));
    const id = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()));
    }, intervalMs);
    return () => clearInterval(id);
  }, [target, intervalMs]);

  return remaining;
}

export function formatRemaining(ms) {
  if (ms == null) return '';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}
