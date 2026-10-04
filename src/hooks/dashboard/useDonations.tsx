'use client';

import { api } from '@/lib/client-api';
import { donationFormSchema, type DonationFormInput } from '@/lib/validations';
import type { IDonation, SupportSettings } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useForm } from 'react-hook-form';
import { useToastMessages } from './useToastMessages';

// The API's own option schema, widened by the document id when editing.
type DonationForm = DonationFormInput;

/**
 * A fresh option: Iranian rails lead the Persian site, so the defaults describe
 * the most common case — a fixed-price coffee paid through a platform link.
 */
const EMPTY: DonationForm = {
  title: '',
  slug: '',
  description: '',
  amount: 0,
  currency: 'toman',
  customAmount: true,
  suggestedAmounts: [],
  minAmount: 0,
  maxAmount: 0,
  mode: 'referral',
  region: 'global',
  referral: '',
  href: '',
  linkProvider: '',
  card: { number: '', holder: '', iban: '' },
  cardQrPayload: '',
  crypto: { network: '', address: '' },
  gateway: '',
  recurring: false,
  cups: 1,
  active: true,
  featured: false,
  order: 0,
};

/** Numbers arrive from `valueAsNumber`, so a cleared field must not become NaN. */
function whole(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Support options list + CRUD for the dashboard. */
const useDonations = () => {
  const locale = useLocale();
  const { ok, fail } = useToastMessages();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<DonationForm>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const {
    data: donations,
    isPending,
    isError,
    error,
    refetch: refetchDonations,
  } = useQuery({
    queryKey: ['donations', locale],
    queryFn: () => api.get<IDonation[]>(`/api/${locale}/admin/donation`),
  });

  /** Which gateways this deployment can charge with, so the form can warn early. */
  const { data: settings } = useQuery({
    queryKey: ['support-settings', locale],
    queryFn: () => api.get<SupportSettings>(`/api/${locale}/admin/settings`),
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: (data: DonationForm) => {
      const body: DonationForm = {
        ...data,
        amount: whole(data.amount),
        minAmount: whole(data.minAmount),
        maxAmount: whole(data.maxAmount),
        cups: whole(data.cups, 1),
        order: whole(data.order),
        // A blank goal means “no target”, not “zero”.
        goal: typeof data.goal === 'number' && Number.isFinite(data.goal) ? data.goal : undefined,
        card: {
          number: data.card?.number?.trim() || '',
          holder: data.card?.holder?.trim() || '',
          iban: data.card?.iban?.trim() || '',
        },
        crypto: { network: data.crypto?.network || '', address: data.crypto?.address?.trim() || '' },
      };
      return body._id ? api.put<IDonation>(`/api/${locale}/admin/donation`, body) : api.post<IDonation>(`/api/${locale}/admin/donation`, body);
    },
    onSuccess: () => {
      ok();
      reset();
      refetchDonations();
    },
    onError: () => fail(),
  });

  const { mutate: deleteDonation, isPending: deleting } = useMutation({
    mutationFn: (id: string) => api.del(`/api/${locale}/admin/donation?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      ok();
      refetchDonations();
    },
    onError: () => fail(),
  });

  /**
   * Row-level toggles send only the flipped flag: the update schema is partial,
   * so a long-form body open in the edit panel is never rewritten by mistake.
   */
  const toggleActive = useMutation({
    mutationFn: (option: IDonation) => api.put<IDonation>(`/api/${locale}/admin/donation`, { _id: option._id, active: !option.active }),
    onSuccess: () => {
      ok();
      refetchDonations();
    },
    onError: () => fail(),
  });

  /**
   * Home flag from the list row, without the form's `reset()` — an open panel may
   * hold unsaved edits that a row toggle must not throw away.
   */
  const toggleFeatured = useMutation({
    mutationFn: (option: IDonation) => {
      const { _id, title, slug, description, amount, currency, customAmount, suggestedAmounts, minAmount, maxAmount, mode, region, referral, href, linkProvider, card, cardQrPayload, crypto, gateway, goal, recurring, cups, active, order } = option;
      return api.put<IDonation>(`/api/${locale}/admin/donation`, {
        _id,
        title,
        slug: slug ?? '',
        description: description ?? '',
        amount,
        currency,
        customAmount,
        suggestedAmounts: suggestedAmounts ?? [],
        minAmount,
        maxAmount,
        mode,
        region,
        referral: referral ?? '',
        href: href ?? '',
        linkProvider: linkProvider ?? '',
        card: card ?? {},
        cardQrPayload: cardQrPayload ?? '',
        crypto: crypto ?? {},
        gateway: gateway ?? '',
        goal: goal ?? undefined,
        recurring,
        cups,
        active,
        order,
        featured: !option.featured,
      });
    },
    onSuccess: () => {
      ok();
      refetchDonations();
    },
    onError: () => fail(),
  });

  // --- quick-pick amounts ---
  const addSuggested = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const current = getValues('suggestedAmounts') || [];
    // A repeated chip is a mistake, and the list keys on the number.
    if (current.includes(value)) return;
    setValue('suggestedAmounts', [...current, value], { shouldDirty: true });
  };

  const removeSuggested = (index: number) => {
    const current = getValues('suggestedAmounts') || [];
    setValue(
      'suggestedAmounts',
      current.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const startEdit = (option: IDonation) => {
    // `.lean()` returns stored documents as they are, so an old record can lack a field.
    reset({
      ...EMPTY,
      ...option,
      description: option.description ?? '',
      amount: whole(option.amount),
      minAmount: whole(option.minAmount),
      maxAmount: whole(option.maxAmount),
      suggestedAmounts: option.suggestedAmounts ?? [],
      referral: option.referral ?? '',
      href: option.href ?? '',
      linkProvider: option.linkProvider ?? '',
      card: { number: option.card?.number ?? '', holder: option.card?.holder ?? '', iban: option.card?.iban ?? '' },
      cardQrPayload: option.cardQrPayload ?? '',
      crypto: { network: option.crypto?.network ?? '', address: option.crypto?.address ?? '' },
      gateway: option.gateway ?? '',
      recurring: Boolean(option.recurring),
      cups: whole(option.cups, 1),
      active: option.active !== false,
      featured: Boolean(option.featured),
      order: whole(option.order),
      _id: option._id,
    });
  };

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    errors,
    donations,
    settings,
    isPending,
    isError,
    error,
    refetchDonations,
    save,
    deleteDonation,
    deleting,
    toggleActive,
    toggleFeatured,
    addSuggested,
    removeSuggested,
    startEdit,
    empty: EMPTY,
    onSubmit: (data: DonationForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useDonations;
