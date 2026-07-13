package com.project.code.Model;

import java.util.List;

public class CreatePurchaseOrderDTO {
    private Long supplierId;
    private Long storeId;
    private String expectedDate;
    private List<CreatePurchaseOrderItemDTO> items;

    public CreatePurchaseOrderDTO() {}

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public String getExpectedDate() {
        return expectedDate;
    }

    public void setExpectedDate(String expectedDate) {
        this.expectedDate = expectedDate;
    }

    public List<CreatePurchaseOrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<CreatePurchaseOrderItemDTO> items) {
        this.items = items;
    }
}
