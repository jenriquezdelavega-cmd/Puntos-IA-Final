import { NextResponse } from 'next/server';

// Legacy endpoint intentionally disabled.
// Use /api/redeem/request + /api/redeem/validate flow with role/session checks.
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint obsoleto. Usa /api/redeem/request y /api/redeem/validate.' },
    { status: 410 }
  );
}
