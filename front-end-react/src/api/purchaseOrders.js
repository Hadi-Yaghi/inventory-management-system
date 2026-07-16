import api from './axios';

export const getPurchaseOrders = async (params) => {
  const response = await api.get('/purchase-orders', { params });
  return response.data;
};

export const getPurchaseOrderById = async (id) => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (poData) => {
  const response = await api.post('/purchase-orders', poData);
  return response.data;
};

export const receiveShipment = async (id, receivedItems) => {
  const response = await api.post(`/purchase-orders/${id}/receive`, receivedItems);
  return response.data;
};

export const cancelPurchaseOrder = async (id) => {
  const response = await api.post(`/purchase-orders/${id}/cancel`);
  return response.data;
};

export const approvePurchaseOrder = async (id) => {
  const response = await api.post(`/purchase-orders/${id}/approve`);
  return response.data;
};
