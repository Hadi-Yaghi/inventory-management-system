package com.project.code.Controller;

import com.project.code.Model.*;
import com.project.code.Service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/purchase-orders")
@Tag(name = "Purchase Order Controller", description = "Endpoints for purchase order management")
public class PurchaseOrderController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @GetMapping
    @Operation(summary = "Get all purchase orders", description = "Retrieve a paginated list of purchase orders with optional filtering by supplier, store, and status.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved purchase orders")
    public ResponseEntity<Map<String, Object>> getAllPurchaseOrders(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) PurchaseOrderStatus status,
            Pageable pageable) {

        Page<PurchaseOrder> page = purchaseOrderService.getPurchaseOrders(supplierId, storeId, status, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", page.getContent());
        response.put("currentPage", page.getNumber());
        response.put("totalItems", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID", description = "Retrieve details of a specific purchase order by ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved purchase order")
    @ApiResponse(responseCode = "404", description = "Purchase order not found")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        PurchaseOrder po = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(po);
    }

    @PostMapping
    @Operation(summary = "Create a purchase order", description = "Create and save a new purchase order. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully created purchase order")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderDTO dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        PurchaseOrder createdPo = purchaseOrderService.createPurchaseOrder(dto, username);
        return ResponseEntity.ok(createdPo);
    }

    @PostMapping("/{id}/receive")
    @Operation(summary = "Receive shipment for a purchase order", description = "Receive stock items, updating inventory levels and purchase order status. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Shipment received successfully")
    @ApiResponse(responseCode = "400", description = "Invalid operation or status mismatch")
    @ApiResponse(responseCode = "404", description = "Purchase order or product not found")
    public ResponseEntity<PurchaseOrder> receiveShipment(
            @PathVariable Long id,
            @RequestBody List<ReceiveItemDTO> receivedItems) {
        PurchaseOrder updatedPo = purchaseOrderService.receiveShipment(id, receivedItems);
        return ResponseEntity.ok(updatedPo);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a purchase order", description = "Cancel a pending/ordered purchase order. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Purchase order cancelled successfully")
    @ApiResponse(responseCode = "400", description = "Cannot cancel already received purchase orders")
    @ApiResponse(responseCode = "404", description = "Purchase order not found")
    public ResponseEntity<PurchaseOrder> cancelPurchaseOrder(@PathVariable Long id) {
        PurchaseOrder cancelledPo = purchaseOrderService.cancelPurchaseOrder(id);
        return ResponseEntity.ok(cancelledPo);
    }
}
