package com.project.code.Controller;

import com.project.code.Model.ReturnRequest;
import com.project.code.Service.ReturnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/returns")
@Tag(name = "Return Controller", description = "Endpoints for handling customer return requests")
public class ReturnController {

    @Autowired
    private ReturnService returnService;

    @PostMapping("/request")
    @Operation(summary = "Submit a return request", description = "Create a return request for a given order item. Accessible by all authenticated roles.")
    @ApiResponse(responseCode = "200", description = "Return request submitted successfully")
    public ResponseEntity<ReturnRequest> requestReturn(
            @RequestParam Long orderItemId,
            @RequestParam Integer quantity,
            @RequestParam String reason) {
        ReturnRequest request = returnService.requestReturn(orderItemId, quantity, reason);
        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve return request", description = "Approve a return request and restock items back to store inventory. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Return request approved successfully")
    public ResponseEntity<ReturnRequest> approveReturn(@PathVariable Long id) {
        ReturnRequest request = returnService.approveReturn(id);
        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject return request", description = "Reject a return request. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Return request rejected successfully")
    public ResponseEntity<ReturnRequest> rejectReturn(@PathVariable Long id) {
        ReturnRequest request = returnService.rejectReturn(id);
        return ResponseEntity.ok(request);
    }

    @GetMapping
    @Operation(summary = "Get all return requests", description = "Retrieve list of all return requests.")
    public ResponseEntity<List<ReturnRequest>> getAllReturnRequests() {
        List<ReturnRequest> requests = returnService.getAllReturnRequests();
        return ResponseEntity.ok(requests);
    }
}
