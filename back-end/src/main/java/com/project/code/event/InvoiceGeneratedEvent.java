package com.project.code.event;

import com.project.code.Model.OrderDetails;

public class InvoiceGeneratedEvent {
    private final OrderDetails orderDetails;
    private final byte[] pdfBytes;

    public InvoiceGeneratedEvent(OrderDetails orderDetails, byte[] pdfBytes) {
        this.orderDetails = orderDetails;
        this.pdfBytes = pdfBytes;
    }

    public OrderDetails getOrderDetails() {
        return orderDetails;
    }

    public byte[] getPdfBytes() {
        return pdfBytes;
    }
}
