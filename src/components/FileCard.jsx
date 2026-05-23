import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, Image as ImageIcon, X } from 'lucide-react';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Sortable file row. Light mode: white card with the same whisper-thin
 * purple border used elsewhere; lifts on hover and on drag.
 */
export default function FileCard({ file, onRemove, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPdf = file.type === 'application/pdf';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group relative card p-3 flex items-center gap-3 select-none',
        'transition-shadow duration-200 hover:shadow-card-hover',
        isDragging ? 'opacity-90 ring-2 ring-accent-400/50 shadow-glow z-10' : '',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-ink-400 hover:text-ink-700 transition-colors p-1 -ml-1"
        aria-label={`Drag to reorder ${file.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Index badge */}
      <div className="hidden sm:flex flex-none items-center justify-center w-7 h-7 rounded-md bg-accent-50 border border-accent-200/60 text-[11px] font-mono text-accent-700">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Thumbnail */}
      <div
        className="flex-none w-14 h-14 rounded-lg overflow-hidden bg-ink-50 relative"
        style={{ border: '1px solid rgba(109, 74, 255, 0.10)' }}
      >
        {file.thumbnail ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={file.thumbnail} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-400">
            {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
          </div>
        )}
        {isPdf && file.pageCount > 1 ? (
          <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-[1px] rounded bg-ink-900/85 text-white font-mono">
            {file.pageCount}p
          </span>
        ) : null}
      </div>

      {/* Meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf ? (
            <FileText className="w-3.5 h-3.5 text-rose-600 flex-none" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-sky-600 flex-none" />
          )}
          <div className="text-sm text-ink-900 truncate font-medium">{file.name}</div>
        </div>
        <div className="mt-0.5 text-[11px] text-ink-500 font-mono">
          {isPdf ? 'PDF' : (file.type || '').replace('image/', '').toUpperCase()} ·{' '}
          {formatBytes(file.size)}
          {isPdf && file.pageCount ? ` · ${file.pageCount} page${file.pageCount === 1 ? '' : 's'}` : ''}
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                   inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-400 hover:text-rose-600 hover:bg-rose-50"
        aria-label={`Remove ${file.name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
