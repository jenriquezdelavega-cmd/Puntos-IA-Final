import { NextResponse } from 'next/server';

// Legacy endpoint intentionally disabled.
// Use POST /api/check-in/scan with tenantUserId guard instead.
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint obsoleto. Usa /api/check-in/scan.' },
    { status: 410 }
  );
}
