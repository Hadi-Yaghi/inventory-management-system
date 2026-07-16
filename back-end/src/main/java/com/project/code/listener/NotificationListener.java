package com.project.code.listener;

import com.project.code.Model.OrderItem;
import com.project.code.Model.ReturnRequest;
import com.project.code.Repo.OrderItemRepository;
import com.project.code.Service.EmailService;
import com.project.code.event.InvoiceGeneratedEvent;
import com.project.code.event.ReturnApprovedEvent;
import com.project.code.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {

    @Autowired
    private EmailService emailService;

    @Autowired
    private OrderItemRepository orderItemRepository;

    // Use fallbackExecution = true so that if it is published outside of an active transaction
    // (e.g. from another committed listener), it will still execute.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleInvoiceGenerated(InvoiceGeneratedEvent event) {
        try {
            emailService.sendOrderConfirmation(event.getOrderDetails(), event.getPdfBytes());
        } catch (Exception e) {
            System.err.println("NotificationListener: Failed to send order confirmation email for order ID " 
                    + event.getOrderDetails().getId() + ": " + e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleReturnApproved(ReturnApprovedEvent event) {
        ReturnRequest request = event.getReturnRequest();
        try {
            OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                    .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));
            String customerEmail = orderItem.getOrder().getCustomer().getEmail();
            emailService.sendReturnStatusEmail(request, customerEmail);
        } catch (Exception e) {
            System.err.println("NotificationListener: Failed to send return approval email for return request ID " 
                    + request.getId() + ": " + e.getMessage());
        }
    }
}
