import { apiSuccess, getRequestId } from '@/app/lib/api-response';

function pickFirstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;
}

export async function GET(request: Request) {
  const commitSha = pickFirstNonEmpty(
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.NEXT_PUBLIC_COMMIT_SHA,
  );

  const branch = pickFirstNonEmpty(
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.NEXT_PUBLIC_GIT_BRANCH,
  );

  return apiSuccess({
    requestId: getRequestId(request),
    data: {
      ok: true,
      service: 'puntos-ia',
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      branch,
      commitSha,
      timestamp: new Date().toISOString(),
    },
  });
}
