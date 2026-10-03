import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible slide-over used by Dashboard, Session, Assignments, Doubts and Career.
 * Same visual treatment as the original drawers; adds Esc-to-close, focus
 * management, focus trap, aria-modal and full-width on small screens.
 */
export default function Drawer({ open, onClose, title, subtitle, icon, footer, children, locked = false, headerHeight = 'h-[60px]' }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Keep the latest callbacks in refs so the effect below only runs when the
  // drawer opens/closes. Depending on `onClose` directly re-ran it on every
  // parent render, stealing focus from inputs while the user typed.
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(locked);
  onCloseRef.current = onClose;
  lockedRef.current = locked;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !lockedRef.current) { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open]);

  if (!open) return null;
  return (
    <>
      <div className="absolute inset-0 bg-black/20 z-40 backdrop-blur-sm" onClick={() => !locked && onClose()} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title}
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[450px] bg-[#0A0A0A] border-l border-white/5 flex flex-col z-50 animate-in slide-in-from-right duration-300 shadow-2xl">
        <div className={`${headerHeight} border-b border-white/5 flex items-center justify-between px-6 shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon}
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-white truncate">{title}</h2>
              {subtitle && <p className="text-[11px] text-white/40 tracking-wide truncate">{subtitle}</p>}
            </div>
          </div>
          <button ref={closeRef} onClick={onClose} disabled={locked} aria-label="Close panel"
            className="text-white/40 hover:text-white p-1.5 rounded hover:bg-white/5 transition-colors disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </>
  );
}
