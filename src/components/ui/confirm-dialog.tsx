'use client';

import React from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { TriangleAlert } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'destructive' | 'primary' | 'danger';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'destructive',
  isLoading = false,
}) => {
  const resolvedDescription = description || message || '';
  const resolvedConfirm = confirmLabel || confirmText || 'Confirm';
  const resolvedCancel = cancelLabel || cancelText || 'Cancel';
  const isDestructive = variant === 'destructive' || variant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {resolvedCancel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {resolvedConfirm}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          <TriangleAlert className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-900">{title}</h4>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{resolvedDescription}</p>
        </div>
      </div>
    </Modal>
  );
};
