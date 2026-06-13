/** Normalize product details from MySQL JSON (array, JSON string, or plain text). */
export function normalizeProductDetails(details: unknown): string[] {
  if (Array.isArray(details)) {
    return details.map(String).filter(Boolean);
  }

  if (typeof details === "string") {
    const trimmed = details.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        // fall through
      }
    }

    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}
