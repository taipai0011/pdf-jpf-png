import { AlertTriangle } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 animate-slide-up px-4">
      <div
        className="backdrop-blur-xl rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-amber-100"
        style={{
          background: 'rgba(120, 53, 15, 0.30)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'rgba(251, 191, 36, 0.30)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)',
        }}
      >
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
