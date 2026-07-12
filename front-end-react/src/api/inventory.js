import api from './axios';

export const getInventory = async () => {
  const response = await api.get('/inventory');
  return response.data.inventory || response.data.products || response.data;
};
