import { ArrowUpRight } from 'lucide-react';
import { TOOLS } from '../lib/tools.js';

function ToolCard({ tool, onOpen }) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(tool.id)}
      className="card group text-left p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(15,13,26,0.05), 0 6px 20px -6px rgba(15,13,26,0.07)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${tool.accent} 0%, #4729b3 100%)` }}
        >
          <Icon className="w-5 h-5" strokeWidth={2.1} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-ink-300 group-hover:text-accent-600 transition-colors" />
      </div>
      <div className="mt-4 font-semibold text-ink-900 tracking-tight">{tool.name}</div>
      <div className="mt-0.5 text-[12px] font-mono text-accent-700/80">{tool.tag}</div>
      <p className="mt-2 text-sm text-ink-500 leading-relaxed">{tool.blurb}</p>
    </button>
  );
}

export default function Home({ onOpen }) {
  return (
    <main className="flex-1 pb-10">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 dot-grid dot-grid-mask opacity-90" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] hero-radial" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-12 sm:pt-16 pb-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight gradient-text leading-[1.05]">
              Image and PDF tools
              <br className="hidden sm:block" /> that never touch a server.
            </h1>
            <p className="mt-5 text-ink-500 text-base sm:text-lg max-w-xl">
              Convert, split, merge and shrink JPG, PNG and PDF files right here in the tab.
              Your files stay on your machine, there&rsquo;s no sign-up, and nothing gets
              held back behind a paywall.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 sm:px-8 pt-2 sm:pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onOpen={onOpen} />
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 sm:px-8 mt-12">
        <div
          className="card p-6 sm:p-7"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #faf9ff 100%)' }}
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-ink-900">Files stay put</div>
              <p className="mt-1 text-sm text-ink-500 leading-relaxed">
                Every conversion runs in your browser. Nothing is uploaded, so nothing can leak.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">Gone in an hour</div>
              <p className="mt-1 text-sm text-ink-500 leading-relaxed">
                Files sit in your browser&rsquo;s own storage and clear themselves 60 minutes after
                you add them.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900">No account, no cap</div>
              <p className="mt-1 text-sm text-ink-500 leading-relaxed">
                Batch as many files as your machine can handle. There&rsquo;s no counter and no
                &ldquo;go pro&rdquo; nag.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
