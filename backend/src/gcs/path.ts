export function buildObjectPath(
  tenant: string,
  provider: 'tiendanube' | 'meta-ads' | 'bcra' | 'ga',
  dataset: string,
  ext: 'json' | 'ndjson' = 'json',
) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const ts = now.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z'); 

  return `${tenant}/${provider}/${dataset}/${yyyy}/${mm}/${dd}/${dataset}-${ts}.${ext}`;
}
