import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const WALLET_CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

function parseServiceAccount() {
  const encoded = (process.env.GOOGLE_WALLET_SA_B64 || '').trim();

  if (!encoded) {
    throw new Error('Missing GOOGLE_WALLET_SA_B64 env var');
  }

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');

  try {
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid GOOGLE_WALLET_SA_B64 content. Expected base64-encoded JSON.');
  }
}

function resolveIssuerId(req: Request) {
  const url = new URL(req.url);
  const fromQuery = (url.searchParams.get('issuerId') || url.searchParams.get('issuer_id') || '').trim();
  const fromEnv =
    (process.env.GOOGLE_WALLET_ISSUER_ID || process.env.GOOGLE_WALLET_ISSUER || process.env.WALLET_ISSUER_ID || '').trim();

  return fromQuery || fromEnv;
}

export async function GET(req: Request) {
  const issuerId = resolveIssuerId(req);

  if (!issuerId) {
    return NextResponse.json(
      {
        error:
          'Missing issuer id. Set GOOGLE_WALLET_ISSUER_ID (or GOOGLE_WALLET_ISSUER / WALLET_ISSUER_ID) or pass ?issuerId=<ISSUER_ID>.',
        envChecks: {
          GOOGLE_WALLET_ISSUER_ID: Boolean((process.env.GOOGLE_WALLET_ISSUER_ID || '').trim()),
          GOOGLE_WALLET_ISSUER: Boolean((process.env.GOOGLE_WALLET_ISSUER || '').trim()),
          WALLET_ISSUER_ID: Boolean((process.env.WALLET_ISSUER_ID || '').trim()),
        },
      },
      { status: 500 },
    );
  }

  try {
    const credentials = parseServiceAccount();

    const auth = new GoogleAuth({
      credentials,
      scopes: [WALLET_SCOPE],
    });

    const tokenClient = await auth.getClient();
    const accessTokenResponse = await tokenClient.getAccessToken();
    const accessToken = accessTokenResponse.token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unable to obtain Google access token' }, { status: 500 });
    }

    const payload = {
      id: `${issuerId}.puntoia_demo`,
      issuerName: 'Punto IA',
      programName: 'Punto IA',
      countryCode: 'MX',
      reviewStatus: 'UNDER_REVIEW',
    };

    const response = await fetch(WALLET_CLASS_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody: unknown = null;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText) as unknown;
      } catch {
        responseBody = { raw: responseText };
      }
    }

    if (response.status === 200 || response.status === 201) {
      return NextResponse.json(responseBody, { status: response.status });
    }

    if (response.status === 409) {
      return NextResponse.json(
        {
          message: 'already exists',
          classId: payload.id,
          details: responseBody,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: 'Google Wallet API request failed',
        status: response.status,
        body: responseBody,
      },
      { status: response.status },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
