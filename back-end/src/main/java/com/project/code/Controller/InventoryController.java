package com.project.code.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.project.code.Model.CombinedRequest;
import com.project.code.Model.Inventory;
import com.project.code.Model.Product;
import com.project.code.Repo.InventoryRepository;
import com.project.code.Repo.ProductRepository;
import com.project.code.Service.ServiceClass;

@RestController
@RequestMapping("/inventory")
@Tag(name = "Inventory Controller", description = "Endpoints for managing store inventory")
public class InventoryController {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ServiceClass serviceClass;

    @GetMapping
    @Operation(summary = "Get all inventory records", description = "Retrieve inventory records across all stores.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved inventory records")
    public List<Map<String, Object>> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::toInventoryResponse)
                .toList();
    }

    @PutMapping
    @Operation(summary = "Update inventory record", description = "Update stock level and associated product details in inventory. Accessible by ADMIN, MANAGER, and EMPLOYEE.")
    @ApiResponse(responseCode = "200", description = "Successfully updated product and inventory")
    public Map<String, String> updateInventory(@RequestBody CombinedRequest request) {
        Product product = request.getProduct();
        Inventory inventory = request.getInventory();

        Map<String, String> map = new HashMap<>();
        System.out.println("Stock Level: " + inventory.getStockLevel());
        if (!serviceClass.ValidateProductId(product.getId())) {
            map.put("message", "Id " + product.getId() + " not present in database");
            return map;
        }
        productRepository.save(product);
        map.put("message", "Successfully updated product with id: " + product.getId());

        if (inventory != null) {
            try {
                Inventory result = serviceClass.getInventoryId(inventory);
                if (result != null) {
                    inventory.setId(result.getId());
                    inventoryRepository.save(inventory);
                } else {
                    map.put("message", "No data available for this product or store id");
                    return map;
                }

            } catch (DataIntegrityViolationException e) {
                map.put("message", "Error: " + e);
                System.out.println(e);
                return map;
            } catch (Exception e) {
                map.put("message", "Error: " + e);
                System.out.println(e);
                return map;
            }
        }

        return map;

    }

    @PostMapping
    @Operation(summary = "Add product to inventory", description = "Save a new product inventory record in a store. Accessible by ADMIN, MANAGER, and EMPLOYEE.")
    @ApiResponse(responseCode = "200", description = "Product added to inventory successfully")
    public Map<String, String> saveInventory(@RequestBody Inventory inventory) {

        Map<String, String> map = new HashMap<>();
        try {
            if (serviceClass.validateInventory(inventory)) {
                inventoryRepository.save(inventory);
            } else {
                map.put("message", "Data Already present in inventory");
                return map;
            }

        } catch (DataIntegrityViolationException e) {
            map.put("message", "Error: " + e);
            System.out.println(e);
            return map;
        } catch (Exception e) {
            map.put("message", "Error: " + e);
            System.out.println(e);
            return map;
        }
        map.put("message", "Product added to inventory successfully");
        return map;
    }

    @GetMapping("/{storeid}")
    @Operation(summary = "Get all products in store inventory with pagination", description = "Retrieve a list of products in the store's inventory using pagination.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved inventory products")
    public Map<String, Object> getAllProducts(@PathVariable Long storeid, Pageable pageable) {
        Map<String, Object> map = new HashMap<>();
        Page<Product> page = productRepository.findProductsByStoreId(storeid, pageable);
        map.put("products", page.getContent());
        map.put("currentPage", page.getNumber());
        map.put("totalItems", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        return map;
    }

    @GetMapping("filter/{category}/{name}/{storeid}")
    @Operation(summary = "Filter inventory products by category and name", description = "Filter inventory products in a specific store by category and name.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved filtered products")
    public Map<String, Object> getProductName(@PathVariable String category, @PathVariable String name,
            @PathVariable long storeid) {
        Map<String, Object> map = new HashMap<>();
        if (category.equals("null")) {
            map.put("product", productRepository.findByNameLike(storeid, name));
            return map;
        } else if (name.equals("null")) {
            System.out.println("name is null");
            map.put("product", productRepository.findByCategoryAndStoreId(storeid, category));
            return map;
        }
        map.put("product", productRepository.findByNameAndCategory(storeid, name, category));
        return map;
    }

    @GetMapping("search/{name}/{storeId}")
    @Operation(summary = "Search inventory products by name", description = "Retrieve products in a store matching a name query.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved search results")
    public Map<String, Object> searchProduct(@PathVariable String name, @PathVariable long storeId) {
        Map<String, Object> map = new HashMap<>();
        map.put("product", productRepository.findByNameLike(storeId, name));
        return map;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove product from inventory by product ID", description = "Delete the inventory record for a product. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully removed product from inventory")
    public Map<String, String> removeProduct(@PathVariable Long id) {
        Map<String, String> map = new HashMap<>();

        if (!serviceClass.ValidateProductId(id)) {
            map.put("message", "Id " + id + " not present in database");
            return map;
        }
        inventoryRepository.deleteByProductId(id);
        map.put("message", "Deleted product successfully with id: " + id);
        return map;
    }

    @GetMapping("validate/{quantity}/{storeId}/{productId}")
    @Operation(summary = "Validate stock quantity", description = "Check if the store has enough stock level for a product.")
    @ApiResponse(responseCode = "200", description = "True if stock level is sufficient, false otherwise")
    public boolean validateQuantity(@PathVariable int quantity, @PathVariable long storeId,
            @PathVariable long productId) {
        Inventory result = inventoryRepository.findByProductIdAndStoreId(productId, storeId);
        if (result.getStockLevel() >= quantity) {
            return true;
        }
        return false;

    }

    @GetMapping("/low-stock/{storeId}")
    @Operation(summary = "Get low stock items for store", description = "Retrieve a list of inventory items for a store where the stock level is below the configured threshold.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved low stock items")
    public List<Inventory> getLowStockItems(@PathVariable Long storeId) {
        return inventoryRepository.findLowStockByStoreId(storeId);
    }

    private Map<String, Object> toInventoryResponse(Inventory inventory) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", inventory.getId());
        response.put("stockLevel", inventory.getStockLevel());
        response.put("quantity", inventory.getStockLevel());
        response.put("lowStockThreshold", inventory.getLowStockThreshold());
        response.put("minThreshold", inventory.getLowStockThreshold());

        if (inventory.getProduct() != null) {
            Map<String, Object> product = new HashMap<>();
            product.put("id", inventory.getProduct().getId());
            product.put("name", inventory.getProduct().getName());
            product.put("sku", inventory.getProduct().getSku());
            product.put("price", inventory.getProduct().getPrice());
            product.put("category", inventory.getProduct().getCategory());
            response.put("product", product);
        }

        if (inventory.getStore() != null) {
            Map<String, Object> store = new HashMap<>();
            store.put("id", inventory.getStore().getId());
            store.put("name", inventory.getStore().getName());
            store.put("address", inventory.getStore().getAddress());
            response.put("store", store);
        }

        return response;
    }

}
