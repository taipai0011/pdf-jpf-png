import { ArrowDownToLine, ArrowRightToLine, Eye, Sparkles } from 'lucide-react';

function Toggle({ value, options, onChange, label }) {
  return (
    <div>
      <div className="field-label mb-2">{label}</div>
      <div
        role="radiogroup"
        className="inline-flex items-center gap-1 rounded-xl bg-ink-50 p-1"
        style={{ border: '1px solid rgba(109, 74, 255, 0.10)' }}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={[
                'relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-all duration-200',
                active
                  ? 'bg-white text-ink-900 shadow-card font-medium'
                  : 'text-ink-500 hover:text-ink-900',
              ].join(' ')}
              style={
                active
                  ? { border: '1px solid rgba(109, 74, 255, 0.16)' }
                  : undefined
              }
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
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
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <div className="card p-5 sm:p-6">
        <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
          <Toggle
            label="Layout"
            value={orientation}
            onChange={setOrientation}
            options={[
              {
                value: 'vertical',
                label: 'Vertical',
                icon: <ArrowDownToLine className="w-4 h-4" />,
              },
              {
                value: 'horizontal',
                label: 'Horizontal',
                icon: <ArrowRightToLine className="w-4 h-4" />,
              },
            ]}
          />
          <Toggle
            label="Output format"
            value={format}
            onChange={setFormat}
            options={[
              { value: 'pdf', label: 'PDF', icon: <span className="text-xs font-mono">.pdf</span> },
              { value: 'png', label: 'PNG', icon: <span className="text-xs font-mono">.png</span> },
              { value: 'jpg', label: 'JPG', icon: <span className="text-xs font-mono">.jpg</span> },
            ]}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-end">
          <button
            type="button"
            disabled={!canMerge || busy}
            onClick={onPreview}
            className="btn-ghost"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            disabled={!canMerge || busy}
            onClick={onMerge}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4" />
            Merge &amp; download
          </button>
        </div>
      </div>
    </section>
  );
}
