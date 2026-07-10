const SAFE_PROVIDER_ERRORS = new Set([
  "Invalid API key",
  "No access to this model",
  "Model not found",
  "Rate limited",
  "Provider temporarily unavailable",
  "Empty or malformed response",
]);

export function toSafeProviderError(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "Connection timed out";
  }
  if (error instanceof Error && SAFE_PROVIDER_ERRORS.has(error.message)) {
    return error.message;
  }
  return "Provider temporarily unavailable";
}
