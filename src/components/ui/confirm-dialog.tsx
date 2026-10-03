'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  danger?: boolean;
  /** Name of the item being deleted, shown for context. */
  itemName?: string;
  onConfirm: () => void;
};

/** Direction-aware delete/confirmation dialog used across the dashboard. */
export function ConfirmDialog({ open, onOpenChange, title, confirmText, cancelText, danger = true, itemName, onConfirm }: ConfirmDialogProps) {
  const t = useTranslations('dashboard');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={danger ? 'h-5 w-5 text-destructive' : 'h-5 w-5'} />
            <span>{title ?? t('confirmTitle')}</span>
          </DialogTitle>
          <DialogDescription>{itemName ? <span className="font-semibold break-words text-foreground">{itemName}</span> : t('confirmDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText ?? t('cancel')}
          </Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmText ?? t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
