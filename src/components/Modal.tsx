import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import shared from '../styles/shared.module.css';
import s from './Modal.module.css';

interface Props {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}

export function Modal({ title, onClose, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div className={s.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.title}>{title}</h2>
        <div className={s.body}>{children}</div>
        <div className={s.actions}>
          <button className={shared.btnSecondary} onClick={onClose}>{cancelLabel}</button>
          <button className={shared.btnPrimary} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
