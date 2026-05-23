import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Trash2 } from 'lucide-react';
import FileCard from './FileCard.jsx';

export default function FileList({ files, onRemove, onReorder, onClearAll }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = files.findIndex((f) => f.id === active.id);
    const newIndex = files.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(files, oldIndex, newIndex).map((f) => f.id);
    onReorder(next);
  };

  if (files.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-ink-900">Files</h3>
          <span className="text-xs text-ink-500">
            {files.length} item{files.length === 1 ? '' : 's'} &middot; drag to reorder
          </span>
        </div>
        <button type="button" onClick={onClearAll} className="btn-danger">
          <Trash2 className="w-3.5 h-3.5" />
          Clear all
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={f.id} className="animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                <FileCard file={f} index={i} onRemove={onRemove} />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
