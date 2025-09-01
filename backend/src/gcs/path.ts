export function buildObjectPath(
  cliente: string,   
  fuente: string,    
  dataset: string,   
  ext: 'json' | 'csv' | 'parquet' = 'json'
) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const stamp = now.toISOString().replace(/[:.-]/g, '');
  return `${cliente}/${fuente}/${dataset}/${yyyy}/${mm}/${dd}/${dataset}-${stamp}.${ext}`;
}
