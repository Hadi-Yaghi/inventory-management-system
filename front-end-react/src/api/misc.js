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

// Returns actions
export const approveReturn = async (id) => (await api.post(`/returns/${id}/approve`)).data;
export const rejectReturn = async (id) => (await api.post(`/returns/${id}/reject`)).data;

// User management
export const deleteUser = async (id) => (await api.delete(`/users/${id}`)).data;

// Stores
export const getStores = async () => (await api.get('/store')).data;

// Stock Transfers
export const getTransfers = async () => (await api.get('/transfers')).data;
export const initiateTransfer = async ({ productId, fromStoreId, toStoreId, quantity }) =>
  (await api.post('/transfers/initiate', null, { params: { productId, fromStoreId, toStoreId, quantity } })).data;
export const confirmTransfer = async (id) => (await api.post(`/transfers/${id}/confirm`)).data;
export const cancelTransfer = async (id) => (await api.post(`/transfers/${id}/cancel`)).data;

// Report Exports
export const exportReport = async (type, format) => {
  const response = await api.get(`/analytics/export/${type}`, {
    params: { format },
    responseType: 'blob',
  });
  return response;
};
