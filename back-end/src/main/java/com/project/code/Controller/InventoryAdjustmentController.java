package com.project.code.Controller;

import com.project.code.Model.Inventory;
import com.project.code.Model.InventoryAdjustment;
import com.project.code.Model.AdjustmentStatus;
import com.project.code.Repo.InventoryAdjustmentRepository;
import com.project.code.Repo.InventoryRepository;
import com.project.code.Repo.ProductRepository;
import com.project.code.Repo.StoreRepository;
import com.project.code.exception.NotFoundException;
import com.project.code.security.SecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/inventory/adjustments")
@Tag(name = "Inventory Adjustment Controller", description = "Endpoints for submitting and approving inventory count adjustments")
public class InventoryAdjustmentController {

    @Autowired
    private InventoryAdjustmentRepository adjustmentRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private SecurityService securityService;

    @PostMapping
    @Operation(summary = "Submit inventory adjustment request", description = "Create a pending adjustment request for a product stock level. Accessible by all authenticated roles.")
    public ResponseEntity<InventoryAdjustment> submitRequest(
            @RequestParam Long productId,
            @RequestParam Long storeId,
            @RequestParam Integer proposedStockLevel,
            @RequestParam(required = false) String reason) {
        
        securityService.verifyStoreAccess(storeId);

        var product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found with ID: " + productId));
        var store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found with ID: " + storeId));

        InventoryAdjustment adjustment = new InventoryAdjustment(
                product, store, proposedStockLevel, reason, securityService.getCurrentUser()
        );

        return ResponseEntity.ok(adjustmentRepository.save(adjustment));
    }

    @GetMapping
    @Operation(summary = "Get adjustment requests history", description = "Get list of all adjustment requests filtered by user assigned stores.")
    public ResponseEntity<List<InventoryAdjustment>> getRequestsHistory() {
        if (securityService.isUserAdmin()) {
            return ResponseEntity.ok(adjustmentRepository.findAll());
        } else {
            Set<Long> storeIds = securityService.getAssignedStoreIds();
            return ResponseEntity.ok(adjustmentRepository.findByStoreIdIn(storeIds));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve adjustment request", description = "Approve request and update physical inventory count. Accessible by ADMIN and MANAGER.")
    public ResponseEntity<InventoryAdjustment> approveRequest(@PathVariable Long id) {
        InventoryAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Adjustment request not found with ID: " + id));

        securityService.verifyStoreAccess(adjustment.getStore().getId());

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new IllegalStateException("Only PENDING adjustment requests can be approved.");
        }

        // Update target inventory count
        Inventory inventory = inventoryRepository.findByProductIdAndStoreId(
                adjustment.getProduct().getId(), adjustment.getStore().getId()
        );

        if (inventory == null) {
            inventory = new Inventory();
            inventory.setProduct(adjustment.getProduct());
            inventory.setStore(adjustment.getStore());
            inventory.setStockLevel(adjustment.getProposedStockLevel());
        } else {
            inventory.setStockLevel(adjustment.getProposedStockLevel());
        }

        inventoryRepository.save(inventory);

        adjustment.setStatus(AdjustmentStatus.APPROVED);
        adjustment.setApprovedBy(securityService.getCurrentUser());
        adjustment.setApprovedAt(LocalDateTime.now());

        return ResponseEntity.ok(adjustmentRepository.save(adjustment));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject adjustment request", description = "Reject the count correction request. Accessible by ADMIN and MANAGER.")
    public ResponseEntity<InventoryAdjustment> rejectRequest(@PathVariable Long id) {
        InventoryAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Adjustment request not found with ID: " + id));

        securityService.verifyStoreAccess(adjustment.getStore().getId());

        if (adjustment.getStatus() != AdjustmentStatus.PENDING) {
            throw new IllegalStateException("Only PENDING adjustment requests can be rejected.");
        }

        adjustment.setStatus(AdjustmentStatus.REJECTED);
        adjustment.setApprovedBy(securityService.getCurrentUser());
        adjustment.setApprovedAt(LocalDateTime.now());

        return ResponseEntity.ok(adjustmentRepository.save(adjustment));
    }
}
