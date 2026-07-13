import api from './axios';

export const getCategories = async () => {
  const response = await api.get('/category');
  return response.data;
};
