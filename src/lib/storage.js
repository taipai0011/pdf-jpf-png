/**
 * IndexedDB-backed storage for uploaded files.
 *
 * Each entry is stored with an `expiresAt` timestamp. Files older than
 * EXPIRY_MS (1 hour by default) are automatically purged on every read,
 * write, and on app load.
 *
 * We store the raw `Blob` directly (IndexedDB handles binary natively), the
 * filename, mime type, size, original index, and a small data URL thumbnail
 * for fast UI rendering.
 */

import { openDB } from 'idb';

export const EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const DB_NAME = 'mergely';
const DB_VERSION = 1;
const STORE = 'files';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('expiresAt', 'expiresAt');
          store.createIndex('order', 'order');
        }
      },
    });
  }
  return dbPromise;
}

function makeId() {
  // crypto.randomUUID is available in modern browsers; fall back if not.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'f_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function purgeExpired() {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  const idx = tx.store.index('expiresAt');
  const now = Date.now();
  let cursor = await idx.openCursor(IDBKeyRange.upperBound(now));
  let purged = 0;
  while (cursor) {
    await cursor.delete();
    purged += 1;
    cursor = await cursor.continue();
  }
  await tx.done;
  return purged;
}

export async function listFiles() {
  await purgeExpired();
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => a.order - b.order);
}

export async function addFile({ name, type, size, blob, thumbnail, pageCount }) {
  const db = await getDB();
  const all = await db.getAll(STORE);
  const maxOrder = all.reduce((m, f) => Math.max(m, f.order ?? 0), -1);
  const now = Date.now();
  const entry = {
    id: makeId(),
    name,
    type,
    size,
    blob,
    thumbnail,
    pageCount: pageCount ?? 1,
    addedAt: now,
    expiresAt: now + EXPIRY_MS,
    order: maxOrder + 1,
  };
  await db.put(STORE, entry);
  return entry;
}

export async function removeFile(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function clearAll() {
  const db = await getDB();
  await db.clear(STORE);
}

export async function reorder(idsInOrder) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  for (let i = 0; i < idsInOrder.length; i += 1) {
    const id = idsInOrder[i];
    const item = await tx.store.get(id);
    if (item) {
      item.order = i;
      await tx.store.put(item);
    }
  }
  await tx.done;
}

/**
 * Returns the timestamp (ms since epoch) of the file that will expire next,
 * or null if there are no files.
 */
export async function nextExpiry() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  if (all.length === 0) return null;
  return all.reduce((min, f) => Math.min(min, f.expiresAt), Infinity);
}
