import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StackProps {
  children: ReactNode;
  className?: string;
}

/**
 * A single bordered surface that separates its children with hairlines.
 * Used by the experience and education lists so related entries read as
 * one composed block instead of a pile of floating cards.
 *
 * The surface is the same `Card` the project and product cards wear, declared
 * once there so the radius, border, ground and shadow of the two cannot drift.
 *
 * `overflow-clip` (not `hidden`) on purpose: it still rounds the corners but
 * does not create a scroll container, so the scroll-linked reveal of the
 * rows stays anchored to the viewport.
 */
export function Stack({ children, className }: StackProps) {
  return <Card className={cn('divide-y divide-border overflow-clip', className)}>{children}</Card>;
}
