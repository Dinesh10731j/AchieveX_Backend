export type ErrorLogPayload = {
  error: string;
  stack?: string;
  code?: string;
  name?: string;
  causes?: string[];
};

const asError = (value: unknown): Error | null => {
  return value instanceof Error ? value : null;
};

export const formatErrorForLog = (value: unknown): ErrorLogPayload => {
  const error = asError(value);

  if (!error) {
    return { error: String(value) };
  }

  const aggregateLike = value as Error & { errors?: unknown[]; code?: string; cause?: unknown };
  const causes: string[] = [];

  if (Array.isArray(aggregateLike.errors)) {
    for (const nested of aggregateLike.errors) {
      const nestedError = asError(nested);
      if (nestedError) {
        causes.push(nestedError.message);
      } else {
        causes.push(String(nested));
      }
    }
  }

  if (aggregateLike.cause) {
    causes.push(aggregateLike.cause instanceof Error ? aggregateLike.cause.message : String(aggregateLike.cause));
  }

  return {
    error: error.message,
    stack: error.stack,
    code: aggregateLike.code,
    name: error.name,
    causes: causes.length ? causes : undefined
  };
};
