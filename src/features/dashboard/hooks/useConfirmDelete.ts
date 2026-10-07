'use client';

import type { ConfirmDialogProps } from '@/components/ui/confirm-dialog';
import { useCallback, useState } from 'react';

/**
 * The delete confirmation every list shares.
 *
 * The dialog lives with the list rather than inside each row, so a hundred records
 * mount one dialog instead of a hundred. `dialogProps` is spread straight onto
 * `ConfirmDialog`, which is what keeps the five sections that already hoisted this
 * and the four that did not from drifting apart again.
 */
export function useConfirmDelete(onDelete: (id: string) => void) {
  const [target, setTarget] = useState<{ id: string; name?: string } | null>(null);

  const request = useCallback((id: string | undefined, name?: string) => {
    if (id) setTarget({ id, name });
  }, []);

  const dialogProps: ConfirmDialogProps = {
    open: Boolean(target),
    onOpenChange: open => {
      if (!open) setTarget(null);
    },
    itemName: target?.name,
    onConfirm: () => {
      if (target) onDelete(target.id);
      setTarget(null);
    },
  };

  return { request, dialogProps };
}
