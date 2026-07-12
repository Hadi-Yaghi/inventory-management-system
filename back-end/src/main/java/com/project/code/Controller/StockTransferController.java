package com.project.code.Controller;

import com.project.code.Model.StockTransfer;
import com.project.code.Service.StockTransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transfers")
@Tag(name = "Stock Transfer Controller", description = "Endpoints for managing store-to-store stock transfers")
public class StockTransferController {

    @Autowired
    private StockTransferService transferService;

    @PostMapping("/initiate")
    @Operation(summary = "Initiate stock transfer", description = "Request to transfer stock from one store to another. Accessible by all authenticated roles.")
    @ApiResponse(responseCode = "200", description = "Transfer initiated successfully")
    public ResponseEntity<StockTransfer> initiateTransfer(
            @RequestParam Long productId,
            @RequestParam Long fromStoreId,
            @RequestParam Long toStoreId,
            @RequestParam Integer quantity) {
        StockTransfer transfer = transferService.initiateTransfer(productId, fromStoreId, toStoreId, quantity);
        return ResponseEntity.ok(transfer);
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm stock transfer receipt", description = "Confirm receipt of transferred stock at destination store. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Transfer completed successfully")
    public ResponseEntity<StockTransfer> confirmReceipt(@PathVariable Long id) {
        StockTransfer transfer = transferService.confirmReceipt(id);
        return ResponseEntity.ok(transfer);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel stock transfer", description = "Cancel transfer and refund stock back to source store inventory. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Transfer cancelled successfully")
    public ResponseEntity<StockTransfer> cancelTransfer(@PathVariable Long id) {
        StockTransfer transfer = transferService.cancelTransfer(id);
        return ResponseEntity.ok(transfer);
    }

    @GetMapping
    @Operation(summary = "Get transfer history", description = "Get list of all stock transfers in the system.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved transfer logs")
    public ResponseEntity<List<StockTransfer>> getTransferHistory() {
        return ResponseEntity.ok(transferService.getTransferHistory());
    }
}
