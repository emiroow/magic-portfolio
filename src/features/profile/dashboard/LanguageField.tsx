'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { LANGUAGE_LEVELS, MAX_LANGUAGES } from '@/constants/global';
import type { ILanguage } from '@/features/profile/types';
import type { LanguageLevel } from '@/types';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LanguageFieldProps {
  /** Live form value: the owner's languages, in the order they are listed. */
  value: ILanguage[];
  onChange: (next: ILanguage[]) => void;
}

/** The proficiency a freshly added row starts on — the middle of the scale. */
const DEFAULT_LEVEL: LanguageLevel = 'intermediate';

/**
 * Languages editor inside the Profile section.
 *
 * Not its own dashboard tab: the languages a person speaks belong with the rest of
 * who they are, so they sit beside the résumé control. Each row is a name and a
 * proficiency; the résumé draws that proficiency as the five-dot scale, so the level
 * list here and the dots there are the same single source (`LANGUAGE_LEVELS`).
 */
export function LanguageField({ value, onChange }: LanguageFieldProps) {
  const t = useTranslations('dashboard.profile');
  const languages = value ?? [];

  const update = (index: number, patch: Partial<ILanguage>) => onChange(languages.map((language, i) => (i === index ? { ...language, ...patch } : language)));
  const remove = (index: number) => onChange(languages.filter((_, i) => i !== index));
  const add = () => onChange([...languages, { name: '', level: DEFAULT_LEVEL }]);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t('languages')}</p>
        <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={add} disabled={languages.length >= MAX_LANGUAGES}>
          <Plus className="me-1.5 size-3.5" aria-hidden />
          {t('addLanguage')}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground/80">{t('languagesHint')}</p>

      {languages.length > 0 ? (
        <ul className="space-y-2">
          {languages.map((language, index) => (
            <li key={index} className="flex items-center gap-2">
              <Input
                className="min-w-0 flex-1"
                value={language.name}
                onChange={event => update(index, { name: event.target.value })}
                placeholder={t('languageNamePlaceholder')}
                aria-label={t('languages')}
              />
              <Select
                className="w-40 shrink-0"
                value={language.level}
                onChange={event => update(index, { level: event.target.value as LanguageLevel })}
                aria-label={t('languageLevel')}
              >
                {LANGUAGE_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {t(`languageLevels.${level}`)}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => remove(index)}
                aria-label={t('removeLanguage')}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground/70">{t('noLanguages')}</p>
      )}
    </div>
  );
}
