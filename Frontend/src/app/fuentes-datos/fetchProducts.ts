import axios from 'axios';
import { toast } from 'sonner';

export async function fetchProducts(storeId: string) {
  try{
    const res = await axios.get(`http://localhost:3001/tiendanube/products?store_id=${storeId}&per_page=30`);
  return res.data;
  } catch (error) {
    throw error;
  }
}
