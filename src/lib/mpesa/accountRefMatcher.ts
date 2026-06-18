/**
 * Normalizes an M-Pesa account reference (or admission number) for matching.
 * Mirrors Postgres `public.normalize_account_ref`:
 *   uppercase, then strip every char that is not [A-Z0-9].
 *
 * "ADM/2026/0001", "adm-2026-0001", " adm 2026 0001 " all collapse to the
 * same key "ADM20260001" so a payer's typo doesn't break auto-matching.
 */
export function normalizeAccountRef(raw: string | null | undefined): string {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * True when both references resolve to the same canonical key.
 */
export function accountRefMatches(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ka = normalizeAccountRef(a);
  const kb = normalizeAccountRef(b);
  return ka.length > 0 && ka === kb;
}