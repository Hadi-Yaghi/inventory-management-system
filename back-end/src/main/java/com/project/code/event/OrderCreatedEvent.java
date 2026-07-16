package com.project.code.event;

import com.project.code.Model.OrderDetails;

public class OrderCreatedEvent {
    private final OrderDetails orderDetails;

    public OrderCreatedEvent(OrderDetails orderDetails) {
        this.orderDetails = orderDetails;
    }

    public OrderDetails getOrderDetails() {
        return orderDetails;
    }
}
