'use client';

import { type FormEvent, type ReactNode, useId } from 'react';
import { Modal } from '@library/Modal';

type AdminDeleteModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isActing: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function AdminDeleteModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  isActing,
  onClose,
  onConfirm,
}: AdminDeleteModalProps) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <Modal isCloseIcon handleModal={onClose} onBackdropClick={onClose}>
      <div
        className="dashboard-confirmModal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <div className="dashboard-confirmModal-actions">
          <button type="button" className="dashboard-confirmModal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="dashboard-confirmModal-danger"
            disabled={isActing}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

type AdminEditModalProps = {
  isOpen: boolean;
  title: string;
  subtitle?: ReactNode;
  formError?: string;
  isActing: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

export function AdminEditModal({
  isOpen,
  title,
  subtitle,
  formError,
  isActing,
  onClose,
  onSubmit,
  children,
}: AdminEditModalProps) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <Modal isCloseIcon handleModal={onClose} onBackdropClick={onClose}>
      <div
        className="dashboard-confirmModal dashboard-editModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        {subtitle}
        <form className="dashboard-editModal-form" onSubmit={(e) => void onSubmit(e)}>
          {formError ? <p className="dashboard-editModal-error">{formError}</p> : null}
          {children}
          <div className="dashboard-confirmModal-actions">
            <button type="button" className="dashboard-confirmModal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dashboard-editModal-save" disabled={isActing}>
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
