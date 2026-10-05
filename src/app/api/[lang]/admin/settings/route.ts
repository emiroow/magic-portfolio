import { apiError, apiJson, requireAdmin } from '@/lib/api';
import { GATEWAY_CURRENCIES } from '@/features/support/constants';
import { configuredGateways } from '@/features/support/payments';
import { langSchema } from '@/lib/validations';
import type { SupportSettings } from '@/features/support/types';

/**
 * Admin view of what the deployment can actually charge with: which gateways have
 * credentials in the environment, and which currency each of them settles in.
 *
 * The dashboard reads this to warn about an option that points at an unconfigured
 * gateway, instead of letting the supporter discover it at checkout.
 */

export const dynamic = 'force-dynamic';

export const GET = async (_request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lang } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  const data: SupportSettings = { gateways: configuredGateways(), currencyRules: GATEWAY_CURRENCIES };
  return apiJson({ data });
};
