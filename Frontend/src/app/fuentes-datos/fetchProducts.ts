import axios from 'axios';

export async function fetchProducts(storeId: string) {
  const res = await axios.get(`http://localhost:3001/tiendanube/products?store_id=${storeId}&per_page=30`);
  return res.data;
}
