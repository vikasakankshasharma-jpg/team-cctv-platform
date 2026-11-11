const localImageCache = new Map<string, string>();

/**
 * Resolves a PDF image/logo URL to a server-safe data URI when stored under /public,
 * avoiding Node/Windows file-path URL scheme issues and redundant network fetches.
 */
export function resolvePdfImageSrc(
  rawUrl?: string | null,
  fallbackUrl = "/logo-horizontal.jpg"
): string {
  const raw = rawUrl || fallbackUrl;
  const normalized =
    raw && !raw.startsWith("C:") && !raw.includes("\\") ? raw : fallbackUrl;

  if (typeof window !== "undefined" || !normalized.startsWith("/")) {
    return normalized;
  }

  const cached = localImageCache.get(normalized);
  if (cached) return cached;

  try {
    const pathMod = eval("require")("path") as typeof import("path");
    const fsMod = eval("require")("fs") as typeof import("fs");
    const localPath = pathMod.join(
      process.cwd(),
      "public",
      normalized.replace(/^\/+/, "")
    );
    if (fsMod.existsSync(localPath)) {
      const ext = pathMod.extname(localPath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".svg"
            ? "image/svg+xml"
            : "image/jpeg";
      const dataUri = `data:${mime};base64,${fsMod.readFileSync(localPath).toString("base64")}`;
      localImageCache.set(normalized, dataUri);
      return dataUri;
    }
  } catch {
    // Fall back to relative path when filesystem access is unavailable
  }

  return normalized;
}
