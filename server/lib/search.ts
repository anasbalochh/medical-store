/**
 * Postgres supports case-insensitive Prisma queries via `mode: 'insensitive'`,
 * but SQLite does not — passing it there throws. Detect the provider at boot
 * (DATABASE_URL prefix) and return the correct query modifier.
 *
 * SQLite's LIKE is already case-insensitive for ASCII, so search works either way.
 */
const url = process.env.DATABASE_URL ?? '';
const isPostgres = url.startsWith('postgres://') || url.startsWith('postgresql://');

export const CI = isPostgres ? { mode: 'insensitive' as const } : {};

export function containsCI(value: string) {
  return { contains: value, ...CI };
}
