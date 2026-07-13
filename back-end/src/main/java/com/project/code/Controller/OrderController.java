package com.project.code.Controller;

import com.project.code.Model.OrderDetails;
import com.project.code.Model.OrderStatus;
import com.project.code.Repo.OrderDetailsRepository;
import com.project.code.Service.OrderService;
import com.project.code.Service.PdfInvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@Tag(name = "Order Controller", description = "Endpoints for managing order status and invoices")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PdfInvoiceService pdfInvoiceService;

    @Autowired
    private OrderDetailsRepository orderDetailsRepository;

    @GetMapping
    @Operation(summary = "Get all orders with pagination", description = "Retrieve a paginated list of orders.")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public ResponseEntity<Map<String, Object>> getAllOrders(Pageable pageable) {
        Page<OrderDetails> page = orderDetailsRepository.findAll(pageable);
        Map<String, Object> response = new HashMap<>();
        response.put("orders", page.getContent());
        response.put("currentPage", page.getNumber());
        response.put("totalItems", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Transition order status", description = "Update the status of an order. Allowed transitions: PENDING -> CONFIRMED/CANCELLED, CONFIRMED -> COMPLETED/CANCELLED. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Order status updated successfully")
    public ResponseEntity<Map<String, String>> transitionStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        orderService.transitionStatus(id, status);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Order status successfully transitioned to " + status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/invoice")
    @Operation(summary = "Download invoice PDF", description = "Generate and download a PDF invoice for the specified order.")
    @ApiResponse(responseCode = "200", description = "Invoice PDF generated successfully")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) {
        OrderDetails order = orderService.getOrderById(id);
        byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(order);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Invoice_" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
