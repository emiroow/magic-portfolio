import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

/**
 * Inline spinner for buttons and image frames.
 *
 * Deliberately `aria-hidden`: every place it renders already says what is happening —
 * a disabled button with its own label, or a frame next to a disabled control. A
 * second, separately announced "loading" would only talk over it, and it had been
 * hardcoded in English on a Persian dashboard.
 */
const Loading = ({ className, size = 'md' }: { className?: string; size?: keyof typeof SIZES }) => (
  <Loader2 aria-hidden className={cn('animate-spin text-muted-foreground', SIZES[size], className)} />
);

export default Loading;
