export function asTrimmedString(value: unknown) {
  return String(value ?? '').trim();
}

export function isValidPhone(value: string) {
  return /^\+?[0-9\s()-]{8,20}$/.test(value);
}

export function normalizePhone(value: string) {
  const raw = asTrimmedString(value);
  if (!raw) return '';

  const compact = raw.replace(/[\s()-]/g, '');
  if (!compact) return '';

  const withoutPlus = compact.startsWith('+') ? compact.slice(1) : compact;
  if (!/^[0-9]+$/.test(withoutPlus)) {
    return compact;
  }

  if (withoutPlus.length === 13 && withoutPlus.startsWith('521')) {
    return withoutPlus.slice(3);
  }

  if (withoutPlus.length === 12 && withoutPlus.startsWith('52')) {
    return withoutPlus.slice(2);
  }

  return withoutPlus;
}

export function buildPhoneLookupCandidates(value: string) {
  const raw = asTrimmedString(value);
  const compact = raw.replace(/[\s()-]/g, '');
  const normalized = normalizePhone(value);
  const candidates = new Set<string>();

  if (raw) candidates.add(raw);
  if (compact) candidates.add(compact);
  if (normalized) candidates.add(normalized);

  if (/^[0-9]+$/.test(normalized) && normalized.length === 10) {
    candidates.add(`52${normalized}`);
    candidates.add(`521${normalized}`);
    candidates.add(`+52${normalized}`);
    candidates.add(`+521${normalized}`);
  }

  return Array.from(candidates);
}

export function isStrongEnoughPassword(value: string) {
  return value.length >= 6;
}

export function normalizeGender(value: unknown) {
  const normalized = asTrimmedString(value);
  if (normalized === 'Hombre' || normalized === 'Mujer') {
    return normalized;
  }
  return 'Otro';
}

export function parseBirthDate(value: unknown) {
  const raw = asTrimmedString(value);
  if (!raw) {
    return null;
  }

  const parsed = new Date(`${raw}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function parseJsonObject(request: Request) {
  try {
    const parsed: unknown = await request.json();

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type SchemaFieldParser<T> = (value: unknown) => T | null;

export type ObjectSchema<T extends Record<string, unknown>> = {
  [K in keyof T]: SchemaFieldParser<T[K]>;
};

export function requiredString(value: unknown) {
  const parsed = asTrimmedString(value);
  return parsed ? parsed : null;
}

export function optionalString(value: unknown) {
  if (value == null) {
    return '';
  }

  return asTrimmedString(value);
}

export function parseWithSchema<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  schema: ObjectSchema<T>
):
  | { ok: true; data: T; field: null }
  | { ok: false; data: null; field: keyof T } {
  const parsed: Partial<T> = {};

  for (const key of Object.keys(schema) as Array<keyof T>) {
    const parser = schema[key];
    const value = parser(body[key as string]);

    if (value === null) {
      return { ok: false, data: null, field: key };
    }

    parsed[key] = value;
  }

  return { ok: true, data: parsed as T, field: null };
}
