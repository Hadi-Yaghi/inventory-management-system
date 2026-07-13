package com.project.code.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_request")
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Order Item ID is required")
    private Long orderItemId;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    @NotNull(message = "Reason is required")
    private String reason;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    private ReturnStatus status = ReturnStatus.REQUESTED;

    private LocalDateTime requestedAt = LocalDateTime.now();

    public ReturnRequest() {
    }

    public ReturnRequest(Long orderItemId, Integer quantity, String reason) {
        this.orderItemId = orderItemId;
        this.quantity = quantity;
        this.reason = reason;
        this.status = ReturnStatus.REQUESTED;
        this.requestedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public ReturnStatus getStatus() {
        return status;
    }

    public void setStatus(ReturnStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }
}
