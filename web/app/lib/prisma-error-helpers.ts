type PrismaErrorLike = {
  code?: string;
  message?: string;
};

function asPrismaErrorLike(error: unknown): PrismaErrorLike {
  if (!error || typeof error !== 'object') return {};
  const candidate = error as PrismaErrorLike;
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
  };
}

export function isMissingTableOrColumnError(error: unknown) {
  const { code, message } = asPrismaErrorLike(error);
  if (code === 'P2021' || code === 'P2022') return true;
  if (!message) return false;

  const normalized = message.toLowerCase();
  return normalized.includes('does not exist') || normalized.includes('no existe');
}
