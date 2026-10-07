'use client';

import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, type ReactNode } from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

interface ChipListProps<T> {
  items: T[];
  onRemove: (index: number) => void;
  /** Chip face; defaults to the item itself, so a plain string list needs nothing. */
  renderChip?: (item: T, index: number) => ReactNode;
  variant?: VariantProps<typeof badgeVariants>['variant'];
  /** Classes on the wrapping list. */
  className?: string;
  /** Classes on each chip, for a list that carries more weight than a form's. */
  chipClassName?: string;
}

/**
 * Removable chips under a composer: technologies, features, tags, suggested amounts.
 *
 * The remove affordance is part of the chip rather than a bin beside it, so the list
 * stays one visual object and wraps cleanly at any width.
 */
export function ChipList<T>({ items, onRemove, renderChip, variant = 'secondary', className, chipClassName }: ChipListProps<T>) {
  const t = useTranslations('dashboard');
  if (items.length === 0) return null;

  return (
    <ul className={className ?? 'flex flex-wrap gap-1.5'}>
      {items.map((item, index) => (
        <li key={index}>
          <Badge variant={variant} className={chipClassName} removeLabel={t('removeChip')} onDelete={() => onRemove(index)}>
            {renderChip ? renderChip(item, index) : String(item)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

interface ChipInputProps {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  /** Doubles as the placeholder and the accessible name of the composer. */
  placeholder: string;
  addLabel: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  /** Where the composer should refuse another entry, and the reason it does. */
  blockedReason?: string;
}

/**
 * Type a value, press Enter (or a comma, or Add) and it becomes a chip.
 *
 * The draft is cleared only once something has actually been committed, so an empty
 * or refused add never swallows what the owner typed.
 */
export function ChipInput({ label, items, onAdd, onRemove, placeholder, addLabel, error, hint, maxLength, blockedReason }: ChipInputProps) {
  const t = useTranslations('dashboard');
  const id = useId();
  const [draft, setDraft] = useState('');
  const blocked = Boolean(blockedReason);

  const value = draft.trim();
  // Said while it is being typed rather than after a rejected add: a chip list keys
  // on its text, so a second copy would read as a mistake the owner did not make.
  const duplicate = value.length > 0 && items.some(item => item.toLowerCase() === value.toLowerCase());

  const commit = () => {
    if (!value || blocked || duplicate) return;
    onAdd(value);
    setDraft('');
  };

  return (
    <Field label={label} id={id} error={error ?? (duplicate ? t('duplicateChip') : undefined)} hint={blockedReason ?? hint}>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            // A comma is the separator an owner reaches for in a list of short names.
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={blocked}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={commit}
          disabled={blocked || !value || duplicate}
        >
          <Plus className="me-1.5 size-3.5" aria-hidden />
          {addLabel}
        </Button>
      </div>
      <ChipList items={items} onRemove={onRemove} />
    </Field>
  );
}
