package com.project.code.listener;

import com.project.code.event.OrderCreatedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class LoyaltyPointsListener {

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        // Future compatibility: placeholder for loyalty points calculation
        System.out.println("Loyalty points listener: OrderCreated event received for order ID " 
                + event.getOrderDetails().getId() + ". Loyalty points will be calculated here in the future.");
    }
}
