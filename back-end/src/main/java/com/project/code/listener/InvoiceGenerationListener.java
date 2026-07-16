package com.project.code.listener;

import com.project.code.Model.OrderDetails;
import com.project.code.Service.PdfInvoiceService;
import com.project.code.event.InvoiceGeneratedEvent;
import com.project.code.event.OrderCreatedEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

@Component
public class InvoiceGenerationListener {

    @Autowired
    private PdfInvoiceService pdfInvoiceService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderCreated(OrderCreatedEvent event) {
        OrderDetails orderDetails = event.getOrderDetails();
        try {
            byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(orderDetails);
            if (pdfBytes != null) {
                eventPublisher.publishEvent(new InvoiceGeneratedEvent(orderDetails, pdfBytes));
            }
        } catch (Exception e) {
            System.err.println("InvoiceGenerationListener: Could not generate PDF invoice for order ID " 
                    + orderDetails.getId() + ": " + e.getMessage());
        }
    }
}
