/**
 * Utilities for safely reading single-line environment variables.
 * Guards against trailing CR/LF (\r\n), accidental literal escaped \r/\n,
 * wrapping quotes, or surrounding whitespace often introduced when piping
 * secrets through CLI tools or Windows shells.
 */
export function cleanEnvVar(value: string | undefined | null): string {
  if (!value) return "";
  let cleaned = value.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\r|\\n|[\r\n]/g, "").trim();
}

/**
 * Extracts digits only from a phone/ID environment variable.
 */
export function cleanPhoneEnvVar(
  value: string | undefined | null,
  fallback = ""
): string {
  const digits = cleanEnvVar(value).replace(/\D/g, "");
  return digits || fallback;
}
