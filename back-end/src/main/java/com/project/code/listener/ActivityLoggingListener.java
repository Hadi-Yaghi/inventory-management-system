package com.project.code.listener;

import com.project.code.Model.*;
import com.project.code.Repo.ActivityLogRepository;
import com.project.code.event.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class ActivityLoggingListener {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        OrderDetails order = event.getOrderDetails();
        log("CREATE", "Order", String.valueOf(order.getId()), "Order placed via placeOrder");
    }

    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        OrderDetails order = event.getOrderDetails();
        log("UPDATE", "Order", String.valueOf(order.getId()), "Order status changed to COMPLETED");
    }

    @EventListener
    public void handleOrderCancelled(OrderCancelledEvent event) {
        OrderDetails order = event.getOrderDetails();
        log("UPDATE", "Order", String.valueOf(order.getId()), "Order status changed to CANCELLED");
    }

    @EventListener
    public void handleStockTransferred(StockTransferredEvent event) {
        StockTransfer transfer = event.getStockTransfer();
        String detailMessage = "Stock transfer ID " + transfer.getId() + " status is now " + transfer.getStatus()
                + " (Product ID: " + transfer.getProductId() + ", Qty: " + transfer.getQuantity() 
                + ", From Store: " + transfer.getFromStoreId() + ", To Store: " + transfer.getToStoreId() + ")";
        log("UPDATE", "StockTransfer", String.valueOf(transfer.getId()), detailMessage);
    }

    @EventListener
    public void handlePurchaseOrderReceived(PurchaseOrderReceivedEvent event) {
        PurchaseOrder po = event.getPurchaseOrder();
        log("UPDATE", "PurchaseOrder", String.valueOf(po.getId()), "Received shipment for purchase order ID: " + po.getId());
    }

    @EventListener
    public void handleReturnApproved(ReturnApprovedEvent event) {
        ReturnRequest request = event.getReturnRequest();
        log("UPDATE", "ReturnRequest", String.valueOf(request.getId()), "Approved return request ID: " + request.getId());
    }

    private void log(String action, String entityType, String entityId, String details) {
        String userId = "ANONYMOUS";
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                userId = auth.getName();
            }
        } catch (Exception ignored) {
        }

        try {
            ActivityLog entry = new ActivityLog(userId, action, entityType, entityId, details);
            activityLogRepository.save(entry);
        } catch (Exception e) {
            System.err.println("ActivityLoggingListener: failed to save log - " + e.getMessage());
        }
    }
}
