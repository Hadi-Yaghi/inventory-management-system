package com.project.code.Controller;

import com.project.code.Model.Customer;
import com.project.code.Model.Inventory;
import com.project.code.Repo.*;
import com.project.code.Service.ReportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/analytics")
@Tag(name = "Analytics Controller", description = "Dashboard analytics and report export endpoints (MANAGER/ADMIN)")
public class AnalyticsController {

    @Autowired
    private OrderDetailsRepository orderDetailsRepository;
    @Autowired
    private OrderItemRepository orderItemRepository;
    @Autowired
    private InventoryRepository inventoryRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private ReportExportService reportExportService;

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping
    @Operation(summary = "Get dashboard summary", description = "Returns top-level dashboard metrics.")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Double revenue = orderDetailsRepository.getTotalRevenue(
                LocalDate.of(2000, 1, 1).atStartOfDay(),
                LocalDateTime.now());
        List<Inventory> lowStock = inventoryRepository.findAllLowStock();
        List<Object[]> counts = orderDetailsRepository.getOrderCountsByStatus();

        long activeOrders = 0;
        Map<String, Object> ordersByStatus = new LinkedHashMap<>();
        for (Object[] row : counts) {
            String status = row[0] != null ? row[0].toString() : "UNKNOWN";
            long count = ((Number) row[1]).longValue();
            ordersByStatus.put(status, count);
            if (!"COMPLETED".equals(status) && !"CANCELLED".equals(status)) {
                activeOrders += count;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", revenue != null ? revenue : 0.0);
        result.put("activeOrders", activeOrders);
        result.put("lowStockCount", lowStock.size());
        result.put("ordersByStatus", ordersByStatus);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get total revenue", description = "Returns total revenue over a date range. Excludes cancelled orders.")
    public ResponseEntity<Map<String, Object>> getTotalRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        Double revenue = orderDetailsRepository.getTotalRevenue(start, end);
        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate.toString());
        result.put("endDate", endDate.toString());
        result.put("totalRevenue", revenue != null ? revenue : 0.0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/top-selling")
    @Operation(summary = "Get top-selling products", description = "Returns top N products by quantity and by revenue.")
    public ResponseEntity<Map<String, Object>> getTopSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {

        List<Object[]> byQuantity = orderItemRepository.getTopSellingProductsByQuantity(PageRequest.of(0, limit));
        List<Object[]> byRevenue = orderItemRepository.getTopSellingProductsByRevenue(PageRequest.of(0, limit));

        List<Map<String, Object>> qtyList = new ArrayList<>();
        for (Object[] row : byQuantity) {
            Map<String, Object> m = new HashMap<>();
            m.put("productId", row[0]);
            m.put("productName", row[1]);
            m.put("totalQuantitySold", row[2]);
            qtyList.add(m);
        }

        List<Map<String, Object>> revList = new ArrayList<>();
        for (Object[] row : byRevenue) {
            Map<String, Object> m = new HashMap<>();
            m.put("productId", row[0]);
            m.put("productName", row[1]);
            m.put("totalRevenue", row[2]);
            revList.add(m);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("topByQuantity", qtyList);
        result.put("topByRevenue", revList);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low-stock items", description = "Returns all inventory items whose stock level is at or below the low-stock threshold, across all stores.")
    public ResponseEntity<List<Map<String, Object>>> getLowStockItems() {
        List<Inventory> lowStock = inventoryRepository.findAllLowStock();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Inventory inv : lowStock) {
            Map<String, Object> m = new HashMap<>();
            m.put("inventoryId", inv.getId());
            m.put("productName", inv.getProduct() != null ? inv.getProduct().getName() : "");
            m.put("storeName", inv.getStore() != null ? inv.getStore().getName() : "");
            m.put("stockLevel", inv.getStockLevel());
            m.put("threshold", inv.getLowStockThreshold());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/orders-by-status")
    @Operation(summary = "Get order counts by status", description = "Returns the number of orders grouped by order status.")
    public ResponseEntity<Map<String, Object>> getOrderCountsByStatus() {
        List<Object[]> counts = orderDetailsRepository.getOrderCountsByStatus();
        Map<String, Object> result = new LinkedHashMap<>();
        for (Object[] row : counts) {
            result.put(row[0] != null ? row[0].toString() : "UNKNOWN", row[1]);
        }
        return ResponseEntity.ok(result);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REPORT EXPORTS
    // ═══════════════════════════════════════════════════════════════════════

    @GetMapping("/export/inventory")
    @Operation(summary = "Export inventory report", description = "Export inventory data as Excel, CSV, or PDF.")
    public ResponseEntity<byte[]> exportInventory(@RequestParam(defaultValue = "excel") String format) throws Exception {
        List<Inventory> all = inventoryRepository.findAll();
        return buildExportResponse(format, "inventory", all, null, null, null, null);
    }

    @GetMapping("/export/sales")
    @Operation(summary = "Export sales report", description = "Export sales data as Excel, CSV, or PDF.")
    public ResponseEntity<byte[]> exportSales(
            @RequestParam(defaultValue = "excel") String format,
            @RequestParam(defaultValue = "20") int limit) throws Exception {

        List<Object[]> byQty = orderItemRepository.getTopSellingProductsByQuantity(PageRequest.of(0, limit));
        List<Object[]> byRev = orderItemRepository.getTopSellingProductsByRevenue(PageRequest.of(0, limit));
        Double totalRev = orderDetailsRepository.getTotalRevenue(
                LocalDate.of(2000, 1, 1).atStartOfDay(),
                LocalDateTime.now());

        return buildExportResponse(format, "sales", null, byQty, byRev, totalRev, null);
    }

    @GetMapping("/export/customers")
    @Operation(summary = "Export customer report", description = "Export customer data as Excel, CSV, or PDF.")
    public ResponseEntity<byte[]> exportCustomers(@RequestParam(defaultValue = "excel") String format) throws Exception {
        List<Customer> customers = customerRepository.findAll();
        return buildExportResponse(format, "customers", null, null, null, null, customers);
    }

    // ── Helper ───────────────────────────────────────────────────────────
    private ResponseEntity<byte[]> buildExportResponse(
            String format, String reportType,
            List<Inventory> inventory, List<Object[]> byQty, List<Object[]> byRev,
            Double totalRevenue, List<Customer> customers) throws Exception {

        byte[] data;
        String contentType;
        String extension;

        switch (format.toLowerCase()) {
            case "csv":
                contentType = "text/csv";
                extension = "csv";
                if ("inventory".equals(reportType)) data = reportExportService.exportInventoryCsv(inventory);
                else if ("sales".equals(reportType)) data = reportExportService.exportSalesCsv(byQty, byRev);
                else data = reportExportService.exportCustomersCsv(customers);
                break;
            case "pdf":
                contentType = "application/pdf";
                extension = "pdf";
                if ("inventory".equals(reportType)) data = reportExportService.exportInventoryPdf(inventory);
                else if ("sales".equals(reportType)) data = reportExportService.exportSalesPdf(byQty, byRev, totalRevenue);
                else data = reportExportService.exportCustomersPdf(customers);
                break;
            default: // excel
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                extension = "xlsx";
                if ("inventory".equals(reportType)) data = reportExportService.exportInventoryExcel(inventory);
                else if ("sales".equals(reportType)) data = reportExportService.exportSalesExcel(byQty, byRev, totalRevenue);
                else data = reportExportService.exportCustomersExcel(customers);
                break;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDispositionFormData("attachment", reportType + "_report." + extension);
        headers.setContentLength(data.length);
        return ResponseEntity.ok().headers(headers).body(data);
    }
}
