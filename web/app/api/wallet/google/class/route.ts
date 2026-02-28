import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { getGoogleWalletIssuerId, googleWalletConfigErrorResponse, parseGoogleServiceAccount } from '@/app/lib/google-wallet';

export const runtime = 'nodejs';

const WALLET_SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';
const WALLET_CLASS_URL = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass';

export async function GET() {
  const issuerId = getGoogleWalletIssuerId();

  if (!issuerId) {
    return NextResponse.json(googleWalletConfigErrorResponse(), { status: 500 });
  }

  try {
    const credentials = parseGoogleServiceAccount();

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
      id: `${issuerId}.puntoia_loyalty`,
      issuerName: 'Punto IA',
      programName: 'Punto IA',
      countryCode: 'MX',
      reviewStatus: 'UNDER_REVIEW',
    };

    const response = await fetch(WALLET_CLASS_URL, {
      method: 'POST',
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
