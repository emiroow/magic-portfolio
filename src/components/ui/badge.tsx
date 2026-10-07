import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeBaseProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * `removeLabel` is required the moment `onDelete` is, because the remove button is
 * an icon on its own: without a name it announces as "button" in every language,
 * and the chip it belongs to is the only thing that says what would be removed.
 */
export type BadgeProps =
  | (BadgeBaseProps & { onDelete?: undefined; removeLabel?: undefined })
  | (BadgeBaseProps & { onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void; removeLabel: string });

function Badge({ className, variant, onDelete, removeLabel, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
      {onDelete && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onDelete(event);
          }}
          aria-label={removeLabel}
          className="-me-1 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
