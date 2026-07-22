package com.project.code.Model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transfer")
public class StockTransfer extends TenantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long productId;
    private Long fromStoreId;
    private Long toStoreId;
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    private TransferStatus status;

    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @ManyToOne
    @JoinColumn(name = "received_by")
    private User receivedBy;

    private LocalDateTime approvedAt;

    public StockTransfer() {}

    public StockTransfer(Long productId, Long fromStoreId, Long toStoreId, Integer quantity, TransferStatus status, LocalDateTime requestedAt) {
        this.productId = productId;
        this.fromStoreId = fromStoreId;
        this.toStoreId = toStoreId;
        this.quantity = quantity;
        this.status = status;
        this.requestedAt = requestedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getFromStoreId() {
        return fromStoreId;
    }

    public void setFromStoreId(Long fromStoreId) {
        this.fromStoreId = fromStoreId;
    }

    public Long getToStoreId() {
        return toStoreId;
    }

    public void setToStoreId(Long toStoreId) {
        this.toStoreId = toStoreId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public TransferStatus getStatus() {
        return status;
    }

    public void setStatus(TransferStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public User getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(User receivedBy) {
        this.receivedBy = receivedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
}
