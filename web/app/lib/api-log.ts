export function logApiEvent(
  route: string,
  event: string,
  data: Record<string, unknown> = {}
) {
  console.info(
    JSON.stringify({
      level: 'info',
      route,
      event,
      ts: new Date().toISOString(),
      ...data,
    })
  );
}

export function logApiError(
  route: string,
  error: unknown,
  data: Record<string, unknown> = {}
) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({
      level: 'error',
      route,
      ts: new Date().toISOString(),
      message,
      ...data,
    })
  );
}
