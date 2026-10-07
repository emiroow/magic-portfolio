import { Briefcase, FolderGit2, GraduationCap, HeartHandshake, Mail, Package, PenLine, UserRound, Wrench, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One glyph per section, drawn on lucide's 24px grid at a single stroke weight so
 * every mark reads as the same hand. Keys mirror the home page's section order.
 */
export const SECTION_MARKS = {
  about: UserRound,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderGit2,
  products: Package,
  blog: PenLine,
  contact: Mail,
  support: HeartHandshake,
} as const;

export type SectionMarkKey = keyof typeof SECTION_MARKS;

interface SectionMarkProps {
  /** Which section the glyph belongs to. */
  mark: SectionMarkKey;
  className?: string;
}

/**
 * Decorative section glyph. Always `aria-hidden`: the heading next to it already
 * names the section, so the mark is ornament, never information.
 */
export function SectionMark({ mark, className }: SectionMarkProps) {
  const Icon: LucideIcon = SECTION_MARKS[mark];
  return <Icon aria-hidden strokeWidth={1.5} className={cn('shrink-0', className)} />;
}
