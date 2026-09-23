/**
 * Renders one field from a tool's declarative options schema as a segmented
 * control. Value equality is loose (== ) so numeric choices like quality
 * (0.7) work without extra plumbing.
 */
export default function OptionField({ field, value, onChange }) {
  const cols = field.choices.length;
  return (
    <div>
      <div className="field-label mb-2.5">{field.label}</div>
      <div
        role="radiogroup"
        aria-label={field.label}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, minmax(0, 1fr))` }}
      >
        {field.choices.map((c) => {
          const active = value === c.value;
          return (
            <button
              key={String(c.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c.value)}
              className={[
                'inline-flex items-center justify-center rounded-lg px-2 py-2.5 text-center transition-all duration-150',
                active ? 'bg-accent-50 text-accent-700' : 'bg-white text-ink-600 hover:bg-accent-50/40',
              ].join(' ')}
              style={{
                borderWidth: 1.5,
                borderStyle: 'solid',
                borderColor: active ? 'rgba(109,74,255,0.45)' : 'rgba(109,74,255,0.10)',
                boxShadow: active
                  ? 'inset 0 0 0 3px rgba(109,74,255,0.10), 0 1px 2px rgba(15,13,26,0.04)'
                  : '0 1px 2px rgba(15,13,26,0.03)',
              }}
            >
              <span className="text-[12px] font-medium leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
