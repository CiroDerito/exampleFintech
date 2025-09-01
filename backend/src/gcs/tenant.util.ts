
export function emailToTenant(email?: string, fallback?: string) {
  const base = (email ?? fallback ?? 'unknown').trim().toLowerCase();
  return base
    .replace(/\s+/g, '_')
    .replace(/\//g, '_')
    .replace(/\\/g, '_'); 
}
