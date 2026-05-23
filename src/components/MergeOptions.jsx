import { ArrowDownToLine, ArrowRightToLine, Eye, Sparkles } from 'lucide-react';

/**
 * Sidebar-style options card. Renders as a single, self-contained card so
 * it can be slotted into a sticky right-rail or stacked under the file list
 * on mobile. The parent owns layout (grid, max-width, sticky offset, etc).
 */

const layoutOptions = [
  {
    value: 'vertical',
    label: 'Vertical',
    icon: <ArrowDownToLine className="w-[18px] h-[18px]" strokeWidth={2.1} />,
  },
  {
    value: 'horizontal',
    label: 'Horizontal',
    icon: <ArrowRightToLine className="w-[18px] h-[18px]" strokeWidth={2.1} />,
  },
];

const formatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
];

function tileBase(active) {
  return {
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: active ? 'rgba(109,74,255,0.45)' : 'rgba(109,74,255,0.10)',
    boxShadow: active
      ? 'inset 0 0 0 3px rgba(109,74,255,0.10), 0 1px 2px rgba(15,13,26,0.04)'
      : '0 1px 2px rgba(15,13,26,0.03)',
  };
}

function LayoutTile({ option, active, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={[
        'flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 transition-all duration-150',
        active ? 'bg-accent-50 text-accent-700' : 'bg-white text-ink-700 hover:bg-accent-50/40',
      ].join(' ')}
      style={tileBase(active)}
    >
      {option.icon}
      <span className="text-[12px] font-medium leading-none">{option.label}</span>
    </button>
  );
}

function FormatTile({ option, active, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center rounded-lg py-2.5 transition-all duration-150',
        active ? 'bg-accent-50 text-accent-700' : 'bg-white text-ink-600 hover:bg-accent-50/40',
      ].join(' ')}
      style={tileBase(active)}
    >
      <span className="font-mono text-[12px] font-semibold leading-none">{option.label}</span>
    </button>
  );
}

export default function MergeOptions({
  orientation,
  setOrientation,
  format,
  setFormat,
  canMerge,
  onPreview,
  onMerge,
  busy,
}) {
  return (
    <div className="card p-5">
      <div role="radiogroup" aria-label="Layout">
        <div className="field-label mb-2.5">Layout</div>
        <div className="grid grid-cols-2 gap-2">
          {layoutOptions.map((opt) => (
            <LayoutTile
              key={opt.value}
              option={opt}
              active={orientation === opt.value}
              onClick={() => setOrientation(opt.value)}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-5 pt-5"
        style={{ borderTop: '1px solid rgba(109,74,255,0.10)' }}
        role="radiogroup"
        aria-label="Output format"
      >
        <div className="field-label mb-2.5">Output format</div>
        <div className="grid grid-cols-3 gap-2">
          {formatOptions.map((opt) => (
            <FormatTile
              key={opt.value}
              option={opt}
              active={format === opt.value}
              onClick={() => setFormat(opt.value)}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-5 pt-5 space-y-2.5"
        style={{ borderTop: '1px solid rgba(109,74,255,0.10)' }}
      >
        <button
          type="button"
          disabled={!canMerge || busy}
          onClick={onPreview}
          className="btn-ghost w-full"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          type="button"
          disabled={!canMerge || busy}
          onClick={onMerge}
          className="btn-primary w-full"
        >
          <Sparkles className="w-4 h-4" />
          Merge &amp; download
        </button>
      </div>
    </div>
  );
}
