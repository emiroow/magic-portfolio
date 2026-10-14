'use client';

import { SkillGlyph } from '@/components/brand-icons';
import { Button } from '@/components/ui/button';
import { useFieldContext } from '@/components/ui/field';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SKILL_CATALOG, skillNameFor, type SkillGroupId } from '@/features/skills/constants';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const GROUP_ORDER: SkillGroupId[] = [
  'general',
  'languages',
  'frameworks',
  'data',
  'infrastructure',
  'quality',
  'mobile',
  'design',
  'intelligence',
  'services',
];

/** Catalogue split into its sections once, up front — never per render. */
const GROUPED = GROUP_ORDER.map(group => ({ group, entries: SKILL_CATALOG.filter(entry => entry.group === group) }));

interface SkillIconPickerProps {
  /** The persisted slug; the single source of truth lives in the parent form. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * A searchable combobox over the toolkit catalogue.
 *
 * The trigger previews the choice (glyph + name); the popover holds a `cmdk` list that
 * filters as you type across canonical names, aliases and abbreviations, while the value
 * written back is always the stable `id`. A stored slug the catalogue no longer lists is
 * pinned as a visible legacy option rather than dropped. Everything is `type="button"` and
 * portalled, so a click never bubbles into the surrounding form's submit.
 */
export function SkillIconPicker({ value, onChange, id }: SkillIconPickerProps) {
  const t = useTranslations('dashboard.skill');
  const { describedBy, invalid } = useFieldContext();
  const [open, setOpen] = useState(false);

  const iconLabel = (slug: string) => (t.has(`icons.${slug}`) ? t(`icons.${slug}`) : skillNameFor(slug));

  const selected = value || '';
  const inCatalogue = useMemo(() => SKILL_CATALOG.some(entry => entry.id === selected), [selected]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-9 min-w-0 justify-between gap-2 px-3 font-normal sm:max-w-56"
          >
            <span className="flex min-w-0 items-center gap-2">
              <SkillGlyph id={selected} className="size-4 shrink-0" />
              <span className="truncate">{selected ? iconLabel(selected) : t('selectIcon')}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" side="bottom" align="start" sideOffset={8}>
          <Command>
            <CommandInput placeholder={t('picker.searchPlaceholder')} />
            <CommandList>
              <CommandEmpty>{t('picker.noResults')}</CommandEmpty>

              {/* A stored slug the catalogue dropped stays selectable, so editing an
                  unrelated field never silently erases the owner's icon. */}
              {selected && !inCatalogue && (
                <CommandGroup heading={t('picker.current')}>
                  <CommandItem value={selected} keywords={[selected, skillNameFor(selected)]} onSelect={() => pick(selected)}>
                    <SkillGlyph id={selected} className="size-4 shrink-0" />
                    <span className="truncate">{iconLabel(selected)}</span>
                    <Check className={`ms-auto size-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
                  </CommandItem>
                </CommandGroup>
              )}

              {GROUPED.map(
                section =>
                  section.entries.length > 0 && (
                    <CommandGroup key={section.group} heading={t(`iconGroups.${section.group}`)}>
                      {section.entries.map(entry => (
                        <CommandItem
                          key={entry.id}
                          value={entry.id}
                          keywords={[entry.id, entry.name, ...(entry.aliases ?? [])]}
                          onSelect={() => pick(entry.id)}
                        >
                          <SkillGlyph id={entry.id} className="size-4 shrink-0" />
                          <span className="truncate">{iconLabel(entry.id)}</span>
                          <Check className={`ms-auto size-4 shrink-0 ${selected === entry.id ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && (
        <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0" aria-label={t('picker.clear')} onClick={() => onChange('')}>
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
