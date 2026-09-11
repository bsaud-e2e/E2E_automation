/** Builds a unique, timestamp-based email so each test run registers a fresh account. */
export function uniqueEmail(prefix: string, domain: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@${domain}`;
}
