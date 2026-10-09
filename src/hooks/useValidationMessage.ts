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
  'Choose a support platform': 'platformInvalid',
  'That service is not a gateway': 'gatewayInvalid',
  'Choose the gateway to charge through': 'gatewayRequired',
  'Choose the network': 'cryptoNetworkRequired',
  'Choose the asset that arrives here': 'cryptoAssetRequired',
  'That asset does not move on that network': 'cryptoAssetNetworkMismatch',
  'A wallet is priced in the coin it receives': 'cryptoCurrencyIsAsset',
  'Add the page supporters should open': 'hrefRequired',
  'Add the receiving address': 'cryptoAddressRequired',
  'Add a card number or a sheba': 'cardRequired',
  'Add an IBAN or a card number': 'ibanOrCardRequired',
  'Enter a valid 16-digit card number': 'cardNumberInvalid',
  'That card number is not one the scheme issues': 'cardSchemeInvalid',
  'Enter a valid Iranian sheba (IR followed by 24 digits)': 'shebaInvalid',
  'Enter a valid IBAN': 'ibanInvalid',
  'An Iranian sheba belongs to the card-to-card market': 'ibanMarketMismatch',
  'Enter the SWIFT code as 8 or 11 characters': 'bicInvalid',
  'A transfer inside Iran has no SWIFT code': 'bicNotForIran',
  'Name the account the transfer is for': 'holderRequired',
  'That address is not one this network issues': 'cryptoAddressInvalid',
  'The address is too long': 'addressTooLong',
  'Add at least one destination': 'destinationsRequired',
  'Turn on at least one destination': 'destinationActiveRequired',
  'That is too many destinations for one method': 'destinationsTooMany',
  'That is too many images': 'imagesTooMany',
  'An image path is required': 'imagePathRequired',
  'Enter a valid image path or URL': 'invalidImagePath',
  'That is too many entries': 'entriesTooMany',
  'An entry cannot be empty': 'entryEmpty',
  'An entry is too long': 'entryTooLong',
  'Two destinations share one name': 'duplicateDestination',
  'Enter an amount above zero': 'amountPositive',
  'The minimum amount is above the maximum': 'amountRange',
  'Enter the amount as a number': 'amountNotNumber',
  'Amount cannot be negative': 'amountNegative',
  'That amount is too large': 'amountTooLarge',
  'Enter the order as a number': 'orderNotNumber',
  'Order must be a whole number': 'orderWhole',
  'Order cannot be negative': 'amountNegative',
  'Order must be 999 or lower': 'orderTooLarge',
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
