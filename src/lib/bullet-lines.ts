const BULLET_PREFIX = /^[\s•\-\*·]+\s*/;

/** Remove leading bullet markers from a line. */
export function stripBulletPrefix(line: string): string {
  return line.replace(BULLET_PREFIX, "").trim();
}

/** Plain newline-separated text → bullet display for textarea. */
export function plainToBulletDisplay(plain: string): string {
  if (!plain.trim()) return "";
  return plain
    .split("\n")
    .map((line) => {
      const text = stripBulletPrefix(line);
      return text ? `• ${text}` : "• ";
    })
    .join("\n");
}

/** Bullet textarea content → plain newline-separated text for storage. */
export function bulletDisplayToPlain(display: string): string {
  return display
    .split("\n")
    .map(stripBulletPrefix)
    .filter(Boolean)
    .join("\n");
}

/** Normalize a single line when parsing stored details. */
export function normalizeDetailLine(line: string): string {
  return stripBulletPrefix(line);
}
