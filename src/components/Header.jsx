import { Layers, ShieldCheck } from 'lucide-react';

/**
 * Sticky frosted-glass navbar. The translucent background + backdrop blur
 * picks up the page color underneath as you scroll, which is what gives
 * Linear/Vercel their "expensive" feel.
 */
export default function Header() {
  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: 'rgba(248, 247, 255, 0.78)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderColor: 'rgba(109, 74, 255, 0.08)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-accent-500/25 blur-md" aria-hidden />
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 shadow-glow">
              <Layers className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-ink-900">Mergely</div>
            <div className="text-[10px] text-ink-500 font-mono uppercase tracking-[0.18em]">
              private merger
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="chip">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% client-side
          </span>
        </div>
      </div>
    </header>
  );
}
