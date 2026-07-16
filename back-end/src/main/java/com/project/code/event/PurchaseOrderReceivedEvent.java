package com.project.code.event;

import com.project.code.Model.PurchaseOrder;
import com.project.code.Model.ReceiveItemDTO;
import java.util.List;

public class PurchaseOrderReceivedEvent {
    private final PurchaseOrder purchaseOrder;
    private final List<ReceiveItemDTO> receivedItems;

    public PurchaseOrderReceivedEvent(PurchaseOrder purchaseOrder, List<ReceiveItemDTO> receivedItems) {
        this.purchaseOrder = purchaseOrder;
        this.receivedItems = receivedItems;
    }

    public PurchaseOrder getPurchaseOrder() {
        return purchaseOrder;
    }

    public List<ReceiveItemDTO> getReceivedItems() {
        return receivedItems;
    }
}
