import * as React from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;
  // só fecha se o clique COMEÇOU no backdrop (arrastar seleção de um input até fora não fecha)
  const pressedOnBackdrop = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handler);
    // trava o scroll da página por trás do modal
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1813]/45 p-4"
      onMouseDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
        pressedOnBackdrop.current = false;
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex w-full max-h-[calc(100vh-2rem)] flex-col rounded-sm border border-border bg-card shadow-xl',
          maxWidth,
        )}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between border-b border-border bg-muted px-4 py-3">
            <div>
              {subtitle && (
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {subtitle}
                </div>
              )}
              {title && <div className="text-[15px] font-semibold mt-0.5">{title}</div>}
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xl leading-none"
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="border-t border-border bg-muted px-4 py-2.5">{footer}</div>
        )}
      </div>
    </div>
  );
}
