import { type ReactNode, useLayoutEffect, useRef } from 'react';

export function StudioDialog({ label, onClose, children, compact = false }: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => { dialog.close(); };
  }, []);
  return <dialog ref={ref} aria-label={label}
    className={`studio-dialog ${compact ? 'studio-dialog-compact' : ''} rounded-xl border border-slate-600 bg-slate-950 text-slate-100 shadow-2xl`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key === 'Escape') event.stopPropagation();
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex]:not([tabindex="-1"])'
      )].filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      const start = event.shiftKey ? last : first;
      const end = event.shiftKey ? first : last;
      if (start && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    }}>
    <div className="flex h-full min-h-0 flex-col">{children}</div>
  </dialog>;
}
