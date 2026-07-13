import api from './axios';

export const getSuppliers = async () => {
  const response = await api.get('/supplier');
  return response.data;
};
