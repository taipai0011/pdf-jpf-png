import { AlertTriangle } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-slide-up px-4">
      <div
        className="rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm bg-white"
        style={{
          color: '#7a4a05',
          border: '1px solid rgba(245, 158, 11, 0.30)',
          boxShadow: '0 10px 30px -10px rgba(15, 13, 26, 0.18)',
        }}
      >
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
