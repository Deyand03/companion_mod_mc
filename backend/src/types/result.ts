/**
 * Result type for operations that can fail.
 * Use instead of throwing exceptions for expected failure cases.
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Creates a successful Result. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Creates a failed Result. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Unwraps a Result, throwing if it's an error. Use only when failure is truly unexpected. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}
