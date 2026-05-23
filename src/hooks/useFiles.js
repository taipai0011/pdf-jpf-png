import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addFile as dbAddFile,
  clearAll as dbClearAll,
  listFiles,
  nextExpiry,
  purgeExpired,
  removeFile as dbRemoveFile,
  reorder as dbReorder,
} from '../lib/storage.js';
import { generateThumbnail, isAccepted } from '../lib/thumbnails.js';

/**
 * Single source of truth for the file list. Handles:
 *  - initial hydration from IndexedDB
 *  - automatic purging of expired files (every 30s + on visibility change)
 *  - thumbnail generation on add
 *  - exposing addFiles / removeFile / clearAll / reorder helpers
 */
export function useFiles() {
  const [files, setFiles] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const expiryTimerRef = useRef(null);

  const refresh = useCallback(async () => {
    const list = await listFiles();
    setFiles(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await purgeExpired();
      const list = await listFiles();
      if (!cancelled) {
        setFiles(list);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Periodic purge: every 30s. Also re-run when the tab becomes visible again
  // so users who leave and come back see the right state immediately.
  useEffect(() => {
    const tick = async () => {
      const removed = await purgeExpired();
      if (removed > 0) await refresh();
    };
    expiryTimerRef.current = setInterval(tick, 30_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(expiryTimerRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [refresh]);

  const addFiles = useCallback(
    async (incoming) => {
      const accepted = Array.from(incoming).filter(isAccepted);
      const rejected = Array.from(incoming).length - accepted.length;
      if (accepted.length === 0) {
        if (rejected > 0) {
          setError('Only JPG, PNG, and PDF files are supported.');
          setTimeout(() => setError(null), 4000);
        }
        return;
      }
      setBusy(true);
      try {
        for (const file of accepted) {
          // eslint-disable-next-line no-await-in-loop
          const { thumbnail, pageCount } = await generateThumbnail(file, file.type);
          // eslint-disable-next-line no-await-in-loop
          await dbAddFile({
            name: file.name,
            type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            size: file.size,
            blob: file,
            thumbnail,
            pageCount,
          });
        }
        await refresh();
        if (rejected > 0) {
          setError(`${rejected} unsupported file${rejected === 1 ? '' : 's'} skipped.`);
          setTimeout(() => setError(null), 4000);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to read one or more files.');
        setTimeout(() => setError(null), 4000);
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const removeFile = useCallback(
    async (id) => {
      await dbRemoveFile(id);
      await refresh();
    },
    [refresh]
  );

  const clearAll = useCallback(async () => {
    await dbClearAll();
    await refresh();
  }, [refresh]);

  const reorderFiles = useCallback(
    async (idsInOrder) => {
      // Optimistic UI: reorder in state first for snappy feedback.
      setFiles((prev) => {
        const lookup = new Map(prev.map((f) => [f.id, f]));
        return idsInOrder.map((id, i) => ({ ...(lookup.get(id) ?? {}), order: i })).filter(Boolean);
      });
      await dbReorder(idsInOrder);
    },
    []
  );

  return {
    files,
    hydrated,
    busy,
    error,
    addFiles,
    removeFile,
    clearAll,
    reorderFiles,
    nextExpiry,
  };
}
