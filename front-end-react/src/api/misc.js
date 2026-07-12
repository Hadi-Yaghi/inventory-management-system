import api from './axios';

export const getReturns = async () => (await api.get('/returns')).data;
export const getReviews = async () => (await api.get('/reviews')).data;
export const getUsers = async () => (await api.get('/users')).data;
export const getActivityLogs = async () => (await api.get('/activity-logs')).data;
export const getAnalytics = async () => (await api.get('/analytics')).data;
