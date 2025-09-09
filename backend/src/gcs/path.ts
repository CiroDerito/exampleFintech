export function buildObjectPath(
  tenant: string,
  provider: 'tiendanube' | 'meta-ads' | 'bcra' | 'ga' | 'merchant',
  dataset: string,
  ext: 'json' | 'ndjson' = 'json',
) {
  // Para snapshots, usar nombres fijos que sobrescriban las versiones anteriores
  if (dataset.startsWith('snapshot')) {
    return `${tenant}/${provider}/${dataset}.${ext}`;
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const ts = now.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z'); 

  return `${tenant}/${provider}/${dataset}/${yyyy}/${mm}/${dd}/${dataset}-${ts}.${ext}`;
}

/**
 * Genera una ruta de snapshot que siempre sobrescribe la versión anterior.
 * Útil para estados actuales que no necesitan historial.
 */
export function buildSnapshotPath(
  tenant: string,
  provider: 'tiendanube' | 'meta-ads' | 'bcra' | 'ga' | 'merchant',
  dataset: string,
  ext: 'json' | 'ndjson' = 'json',
) {
  return `${tenant}/${provider}/${dataset}-latest.${ext}`;
}

/**
 * Genera una ruta con timestamp para datos que necesitan historial.
 * Útil para transacciones, logs, etc.
 */
export function buildHistoricalPath(
  tenant: string,
  provider: 'tiendanube' | 'meta-ads' | 'bcra' | 'ga' | 'merchant',
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
