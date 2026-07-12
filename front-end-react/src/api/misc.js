import api from './axios';

export const getReturns = async () => (await api.get('/returns')).data;
export const getReviews = async () => {
  const response = await api.get('/reviews');
  return response.data.reviews || response.data;
};
export const getUsers = async () => (await api.get('/users')).data;
export const getActivityLogs = async () => {
  const response = await api.get('/admin/activity-logs');
  return response.data.logs || response.data;
};
export const getAnalytics = async () => (await api.get('/analytics')).data;
