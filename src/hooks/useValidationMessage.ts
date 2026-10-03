'use client';

import { useTranslations } from 'next-intl';

/**
 * Zod schemas are shared with the API, so their messages are plain English
 * strings. This maps the known ones onto the `validation` namespace; anything
 * unexpected (a server-side error, a new rule) falls through untranslated
 * instead of disappearing.
 */
const MESSAGE_KEYS: Record<string, string> = {
  'Name is required': 'nameRequired',
  'Full name is required': 'fullNameRequired',
  'Job title is required': 'jobTitleRequired',
  'Title is required': 'titleRequired',
  'Description is required': 'descriptionRequired',
  'Company is required': 'companyRequired',
  'School is required': 'schoolRequired',
  'Slug is required': 'slugRequired',
  'Slug may contain letters, digits and dashes': 'slugPattern',
  'Price is required': 'priceRequired',
  'Price cannot be negative': 'priceNegative',
  'Choose a currency': 'currencyRequired',
  'Category is too long': 'categoryTooLong',
  'Must be a valid URL': 'invalidUrl',
  'Invalid url': 'invalidUrl',
  'Invalid id': 'invalidId',
};

/** Translate a validation message coming from zod or the API. */
export function useValidationMessage() {
  const t = useTranslations('validation');

  return (message?: string) => {
    if (!message) return undefined;
    const key = MESSAGE_KEYS[message];
    return key ? t(key) : message;
  };
}
