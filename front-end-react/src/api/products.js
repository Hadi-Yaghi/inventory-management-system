import api from './axios';

export const getProducts = async () => {
  const response = await api.get('/product');
  return response.data.products || response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/product', productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/product/${id}`);
  return response.data;
};
