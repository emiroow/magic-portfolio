'use client';

import { api } from '@/lib/client-api';
import { donationFormSchema, type DonationFormInput } from '@/features/support/schema';
import { handlesMoney, variantFields, withUniqueKeys } from '@/features/support/variants';
import { CRYPTO_NETWORKS, assetsForNetwork, networksForAsset } from '@/features/support/constants';
import { CRYPTO_ASSETS } from '@/constants/global';
import type { DonationMode, IDonation, SupportSettings, SupportVariant } from '@/features/support/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, type UseFormRegister } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useToastMessages } from '@/hooks/useToastMessages';
import { pendingRecordId } from '@/hooks/pendingRecordId';

/** The API's own method shape, widened by the document id when editing. */
export type DonationForm = DonationFormInput;
export type DonationVariant = DonationForm['variants'][number];

/**
 * Fields a destination row can hold, and the only paths its inputs register.
 * Exported because the row lives in its own file and must not invent the paths again.
 */
export type VariantField =
  | 'label'
  | 'provider'
  | 'href'
  | 'instruction'
  | 'number'
  | 'iban'
  | 'bic'
  | 'holder'
  | 'qrPayload'
  | 'network'
  | 'asset'
  | 'address'
  | 'currency'
  | 'region'
  | 'amount'
  | 'customAmount'
  | 'suggestedAmounts'
  | 'minAmount'
  | 'maxAmount'
  | 'active';

/** One row's errors, so a message lands under the input that caused it. */
export type VariantErrors = Partial<Record<VariantField, { message?: string }>>;

/** How the form hands a destination row its registration function. */
export type DonationRegister = UseFormRegister<DonationForm>;

/**
 * A fresh destination. Which of these fields mean anything is decided by the
 * method's own mode, so the form shows a handful at a time.
 */
const EMPTY_VARIANT: DonationVariant = {
  key: '',
  label: '',
  provider: '',
  href: '',
  instruction: '',
  number: '',
  iban: '',
  bic: '',
  holder: '',
  qrPayload: '',
  network: '',
  asset: '',
  address: '',
  currency: '',
  region: '',
  // The destination's own amount policy; meaningful only inside a method that moves money.
  amount: 0,
  customAmount: true,
  suggestedAmounts: [],
  minAmount: 0,
  maxAmount: 0,
  active: true,
};

/**
 * A fresh method. The default is the door that needs no credentials: a page on a
 * support platform. The amount policy lives on each destination, not here; `currency`
 * and `region` are only the defaults a destination inherits when it names none.
 */
const EMPTY: DonationForm = {
  title: '',
  slug: '',
  description: '',
  mode: 'platform',
  region: 'global',
  variants: [{ ...EMPTY_VARIANT, provider: 'buymeacoffee' }],
  currency: 'toman',
  active: true,
  order: 0,
};

/**
 * Number inputs report a cleared field as `NaN`, which would fail validation for a
 * value the schema already treats as “none”. Folding it to `0` keeps an emptied
 * limit mean exactly what the hint says.
 */
export const numberField = { setValueAs: (value: unknown) => (value === '' || value === null || value === undefined ? 0 : Number(value)) } as const;

/** Numbers arrive from `numberField`, so a cleared field is already `0`. */
function whole(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * One row as it is stored: only the fields its own method spends money with — plus,
 * for a method that moves money, the destination's amount policy — with empty strings
 * dropped so a document never carries `iban: ""`. Numbers and the quick-pick list are
 * kept even when zero or empty, because `0` is a stored "no limit / no fixed price".
 */
function cleanVariant(mode: DonationMode, row: DonationVariant): SupportVariant {
  const money = handlesMoney(mode);
  const keep = new Set<string>(['key', 'label', 'active', 'currency', 'region', ...variantFields(mode)]);
  if (money) (['amount', 'minAmount', 'maxAmount', 'customAmount', 'suggestedAmounts'] as const).forEach(field => keep.add(field));
  const out: Record<string, unknown> = { active: row.active !== false };

  for (const [field, value] of Object.entries(row)) {
    if (!keep.has(field)) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) out[field] = trimmed;
    } else if (typeof value === 'boolean') {
      out[field] = value;
    } else if (typeof value === 'number') {
      out[field] = Number.isFinite(value) ? value : 0;
    } else if (Array.isArray(value)) {
      if (money && field === 'suggestedAmounts') out[field] = value.filter(n => typeof n === 'number' && Number.isFinite(n) && n > 0);
    }
  }

  // A wallet is priced in the coin it receives, so storing a second answer next to the
  // asset would only give the two a chance to disagree. `normalizeDonation` reads the
  // unit off the asset on the way back out.
  if (mode === 'crypto') delete out.currency;

  return out as unknown as SupportVariant;
}

/** Support methods list + CRUD for the dashboard. */
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
    control,
    formState: { errors },
  } = useForm<DonationForm>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  /** The destinations of the method being edited, in the order the page shows them. */
  const variantList = useFieldArray({ control, name: 'variants' });

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
      const mode = data.mode;
      const rows = data.variants.map(variant => cleanVariant(mode, variant)).filter(Boolean);

      const body: DonationForm = {
        ...data,
        order: whole(data.order),
        // The amount policy is carried by each cleaned destination, not the method. Keys
        // come from what each destination holds, so two rows can never collide.
        variants: withUniqueKeys(mode, rows),
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

  const deleteMutation = useMutation({
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
  const activeMutation = useMutation({
    mutationFn: (method: IDonation) => api.put<IDonation>(`/api/${locale}/admin/donation`, { _id: method._id, active: !method.active }),
    onSuccess: () => {
      ok();
      refetchDonations();
    },
    onError: () => fail(),
  });

  // --- quick-pick amounts, per destination ---
  const addVariantSuggested = (index: number, value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    const current = getValues(`variants.${index}.suggestedAmounts`) ?? [];
    // A repeated chip is a mistake, and the list keys on the number.
    if (current.includes(value)) return;
    setValue(`variants.${index}.suggestedAmounts`, [...current, value], { shouldDirty: true });
  };

  const removeVariantSuggested = (index: number, pos: number) => {
    const current = getValues(`variants.${index}.suggestedAmounts`) ?? [];
    setValue(
      `variants.${index}.suggestedAmounts`,
      current.filter((_, i) => i !== pos),
      { shouldDirty: true }
    );
  };

  /**
   * Coin and ledger are picked together, so each choice narrows the other.
   *
   * Moving one takes the other to a pairing that actually exists: an owner should not
   * have to know which chains carry USDT to record a USDT wallet, and a destination that
   * sends a token over a ledger that cannot hold it is money lost rather than a typo.
   */
  const setVariantAsset = (index: number, asset: string) => {
    const ledgers = networksForAsset(asset ? (asset as SupportVariant['asset']) : undefined, CRYPTO_NETWORKS);
    const network = getValues(`variants.${index}.network`);
    setValue(`variants.${index}.asset`, asset as SupportVariant['asset'], { shouldValidate: true, shouldDirty: true });
    if (network && !ledgers.includes(network)) {
      setValue(`variants.${index}.network`, (ledgers[0] ?? '') as SupportVariant['network'], { shouldValidate: true, shouldDirty: true });
    }
  };

  const setVariantNetwork = (index: number, network: string) => {
    const carried = assetsForNetwork(network ? (network as SupportVariant['network']) : undefined, CRYPTO_ASSETS);
    const asset = getValues(`variants.${index}.asset`);
    setValue(`variants.${index}.network`, network as SupportVariant['network'], { shouldValidate: true, shouldDirty: true });
    if (asset && !carried.includes(asset)) {
      setValue(`variants.${index}.asset`, (carried[0] ?? '') as SupportVariant['asset'], { shouldValidate: true, shouldDirty: true });
    }
  };

  /**
   * Changing the method keeps the identity and the money policy and throws the
   * destinations away: a wallet address is not a card number, and a row that
   * quietly changes what it holds is worse than an empty one.
   */
  const setMode = (mode: DonationMode) => {
    setValue('mode', mode, { shouldValidate: true, shouldDirty: true });
    variantList.replace([{ ...EMPTY_VARIANT }]);
  };

  const addVariant = () => variantList.append({ ...EMPTY_VARIANT });

  const removeVariant = (index: number) => {
    // The last destination is the method: without it there is nothing to pay into.
    if (variantList.fields.length <= 1) return;
    variantList.remove(index);
  };

  const startEdit = (method: IDonation) => {
    // `.lean()` returns stored documents as they are, so an old record can lack a field.
    reset({
      ...EMPTY,
      ...method,
      description: method.description ?? '',
      variants: (method.variants ?? []).length
        ? method.variants.map(variant => ({
            ...EMPTY_VARIANT,
            ...variant,
            label: variant.label ?? '',
            provider: variant.provider ?? '',
            href: variant.href ?? '',
            instruction: variant.instruction ?? '',
            number: variant.number ?? '',
            iban: variant.iban ?? '',
            bic: variant.bic ?? '',
            holder: variant.holder ?? '',
            qrPayload: variant.qrPayload ?? '',
            network: variant.network ?? '',
            asset: variant.asset ?? '',
            address: variant.address ?? '',
            currency: variant.currency ?? '',
            region: variant.region ?? '',
            amount: whole(variant.amount),
            minAmount: whole(variant.minAmount),
            maxAmount: whole(variant.maxAmount),
            customAmount: variant.customAmount ?? true,
            suggestedAmounts: variant.suggestedAmounts ?? [],
            active: variant.active !== false,
          }))
        : [{ ...EMPTY_VARIANT }],
      order: whole(method.order),
      _id: method._id,
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
    deleteDonation: deleteMutation.mutate,
    deletingId: pendingRecordId(deleteMutation),
    toggleActive: activeMutation.mutate,
    togglingActiveId: pendingRecordId(activeMutation),
    addVariantSuggested,
    removeVariantSuggested,
    setVariantAsset,
    setVariantNetwork,
    setMode,
    addVariant,
    removeVariant,
    variantFieldsArray: variantList,
    startEdit,
    onSubmit: (data: DonationForm, onSaved?: () => void) => save.mutate(data, { onSuccess: onSaved }),
  };
};

export default useDonations;
