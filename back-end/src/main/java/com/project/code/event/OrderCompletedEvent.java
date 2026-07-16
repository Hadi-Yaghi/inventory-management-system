package com.project.code.event;

import com.project.code.Model.OrderDetails;

public class OrderCompletedEvent {
    private final OrderDetails orderDetails;

    public OrderCompletedEvent(OrderDetails orderDetails) {
        this.orderDetails = orderDetails;
    }

    public OrderDetails getOrderDetails() {
        return orderDetails;
    }
}
