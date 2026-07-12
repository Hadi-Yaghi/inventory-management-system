import api from './axios';

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

// Add other product API calls here as needed (create, update, delete)
