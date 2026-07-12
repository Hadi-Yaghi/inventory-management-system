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
