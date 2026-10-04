const OMISE_API = 'https://api.omise.co';

function getAuthorizationHeader() {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) throw new Error('Missing OMISE_SECRET_KEY');
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export type OmiseCharge = {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'expired' | string;
  paid: boolean;
  metadata?: { reservation_id?: string };
  source?: {
    scannable_code?: {
      image?: { download_uri?: string | null } | null;
    } | null;
  } | null;
};

export async function createPromptPayCharge(amount: number, reservationId: string) {
  const params = new URLSearchParams({
    amount: String(amount),
    currency: 'THB',
    'source[type]': 'promptpay',
    'metadata[reservation_id]': reservationId,
  });

  const response = await fetch(`${OMISE_API}/charges`, {
    method: 'POST',
    headers: {
      Authorization: getAuthorizationHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) {
    const message = typeof result?.message === 'string' ? result.message : 'Omise could not create the payment';
    throw new Error(message);
  }
  return result as OmiseCharge;
}

export async function retrieveOmiseCharge(chargeId: string) {
  const response = await fetch(`${OMISE_API}/charges/${encodeURIComponent(chargeId)}`, {
    headers: { Authorization: getAuthorizationHeader() },
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) throw new Error('Could not verify payment with Omise');
  return result as OmiseCharge;
}
