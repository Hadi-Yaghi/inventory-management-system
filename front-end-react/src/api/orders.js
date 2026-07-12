import api from './axios';

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};
