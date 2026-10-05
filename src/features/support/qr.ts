import QRCode from 'qrcode';

/**
 * QR payloads for the support page.
 *
 * The code is generated on the server and handed to the browser as a PNG data
 * URL, so no third-party QR host is ever contacted and nothing about a
 * supporter's gift leaves the site.
 */

/** Pure-black modules on a white field: the contrast banks and wallets expect. */
const DARK = '#000000ff';
const LIGHT = '#ffffffff';

export async function qrDataUrl(content: string, size = 260): Promise<string | null> {
  const payload = content.trim();
  if (!payload) return null;

  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark: DARK, light: LIGHT },
    });
  } catch {
    // An address the encoder rejects (too long, say) must not take the page down.
    console.error('[qr] generation failed');
    return null;
  }
}

/**
 * Payload for a card-to-card code. Bank apps differ in what they accept, so the
 * default is the bare card number — the one format every Iranian bank scanner
 * reads — and the owner can override it with a bank-issued payload.
 */
export function cardQrPayload(input: { number?: string; iban?: string; override?: string }): string {
  const override = (input.override || '').trim();
  if (override) return override;
  return (input.number || input.iban || '').trim();
}

/** BIP-21 style URI for on-chain coins, and the plain destination for Lightning. */
export function cryptoQrPayload(network: string | undefined, address: string): string {
  const target = address.trim();
  if (network === 'lightning') return target.toLowerCase().startsWith('lightning:') ? target : `lightning:${target}`;
  if (!target.includes(':')) return target;
  return target;
}
