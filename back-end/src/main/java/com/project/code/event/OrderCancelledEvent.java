package com.project.code.event;

import com.project.code.Model.OrderDetails;

public class OrderCancelledEvent {
    private final OrderDetails orderDetails;

    public OrderCancelledEvent(OrderDetails orderDetails) {
        this.orderDetails = orderDetails;
    }

    public OrderDetails getOrderDetails() {
        return orderDetails;
    }
}
