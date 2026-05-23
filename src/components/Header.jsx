import { Layers, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="relative z-10">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-accent-500/30 blur-md" aria-hidden />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-700 shadow-glow">
              <Layers className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-zinc-50">Mergely</div>
            <div className="text-[11px] text-zinc-400 font-mono uppercase tracking-widest">
              private merger
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="chip">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% client-side
          </span>
        </div>
      </div>
    </header>
  );
}
