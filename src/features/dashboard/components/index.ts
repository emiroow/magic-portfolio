/**
 * The dashboard's own component set.
 *
 * Everything here exists because at least two sections needed the same thing and had
 * each grown their own copy. One import line per section keeps the nine archives
 * reading as one product instead of nine.
 */
export { SectionShell } from '@/features/dashboard/components/SectionShell';
export { FormPanel, FormActions } from '@/features/dashboard/components/FormPanel';
export { EmptyState } from '@/features/dashboard/components/EmptyState';
export { ErrorState } from '@/features/dashboard/components/ErrorState';
export { CardListSkeleton, ChipListSkeleton, FormSkeleton } from '@/features/dashboard/components/Skeletons';
export { EntityCard, EntityList, EntityThumb } from '@/features/dashboard/components/EntityCard';
export { ResumeRow } from '@/features/dashboard/components/ResumeRow';
export { Dot, TagChip, StatusChip, HomeSlotChip } from '@/features/dashboard/components/Chips';
export { RowAction } from '@/features/dashboard/components/RowAction';
export { ImageField } from '@/features/dashboard/components/ImageField';
export { ChipInput, ChipList } from '@/features/dashboard/components/ChipInput';
export { AdminToolbar } from '@/features/dashboard/components/AdminToolbar';
