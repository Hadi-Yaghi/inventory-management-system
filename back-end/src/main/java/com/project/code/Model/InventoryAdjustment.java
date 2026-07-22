package com.project.code.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_adjustment")
public class InventoryAdjustment extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    @NotNull(message = "Product is required")
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "store_id")
    @NotNull(message = "Store is required")
    private Store store;

    @NotNull(message = "Proposed stock level is required")
    private Integer proposedStockLevel;

    private String reason;

    @Enumerated(EnumType.STRING)
    @NotNull
    private AdjustmentStatus status = AdjustmentStatus.PENDING;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "requested_by")
    @NotNull
    private User requestedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @NotNull
    private LocalDateTime requestedAt = LocalDateTime.now();

    private LocalDateTime approvedAt;

    public InventoryAdjustment() {
    }

    public InventoryAdjustment(Product product, Store store, Integer proposedStockLevel, String reason, User requestedBy) {
        this.product = product;
        this.store = store;
        this.proposedStockLevel = proposedStockLevel;
        this.reason = reason;
        this.requestedBy = requestedBy;
        this.status = AdjustmentStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(Store store) {
        this.store = store;
    }

    public Integer getProposedStockLevel() {
        return proposedStockLevel;
    }

    public void setProposedStockLevel(Integer proposedStockLevel) {
        this.proposedStockLevel = proposedStockLevel;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public AdjustmentStatus getStatus() {
        return status;
    }

    public void setStatus(AdjustmentStatus status) {
        this.status = status;
    }

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
}
