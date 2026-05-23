import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 sm:px-8 py-10 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <div>
          Built with care &middot; All processing happens in your browser.
        </div>
        <a
          href="https://github.com/taipai0011/pdf-jpf-png"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Source</span>
        </a>
      </div>
    </footer>
  );
}
