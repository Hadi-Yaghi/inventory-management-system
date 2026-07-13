import api from './axios';

export const getOrders = async () => {
  const response = await api.get('/orders');
  const orders = response.data.orders || response.data;
  return orders.map((order) => ({
    ...order,
    orderDate: order.date,
    status: order.orderStatus,
    totalAmount: order.totalPrice,
  }));
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}/status`, null, { params: { status } });
  return response.data;
};

export const downloadInvoice = async (id) => {
  const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
  return response;
};
