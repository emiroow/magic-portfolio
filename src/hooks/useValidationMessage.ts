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
  'Choose a payment method': 'paymentMethodRequired',
  'Choose a market': 'regionRequired',
  'Choose the platform': 'platformRequired',
  'Choose the gateway the link belongs to': 'linkProviderRequired',
  'Choose the gateway to charge through': 'gatewayRequired',
  'Choose the network': 'cryptoNetworkRequired',
  'Add the platform page supporters should open': 'hrefRequired',
  'Add the checkout link you prepared': 'linkRequired',
  'Add the receiving address': 'cryptoAddressRequired',
  'Add a card number or an IBAN': 'cardRequired',
  'Enter a 16-digit card number': 'cardNumberInvalid',
  'Enter a valid IBAN (IR followed by 24 digits)': 'ibanInvalid',
  'Enter a valid address': 'cryptoAddressInvalid',
  'Enter an amount above zero': 'amountPositive',
  'The minimum amount is above the maximum': 'amountRange',
  'Goal must be a number': 'goalInvalid',
  'At least one cup': 'cupsRequired',
  'Order is required': 'orderRequired',
  'The name is too long': 'nameTooLong',
  'The message is too long': 'messageTooLong',
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
