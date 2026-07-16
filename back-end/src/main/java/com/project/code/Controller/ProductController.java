package com.project.code.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import com.project.code.Model.Product;
import com.project.code.Repo.InventoryRepository;
import com.project.code.Repo.OrderItemRepository;
import com.project.code.Repo.ProductRepository;
import com.project.code.Service.ServiceClass;

@RequestMapping("/product")
@RestController
@Tag(name = "Product Controller", description = "Endpoints for managing products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ServiceClass serviceClass;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private com.project.code.Repo.ReviewRepository reviewRepository;

    @GetMapping("/search")
    @Operation(summary = "Search products with combined filters", description = "Query products by SKU, Category, Price range, Store availability, and minimum average rating from MongoDB reviews.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved search results")
    @Cacheable(value = "products", key = "'search_' + (#sku?:'') + '_' + (#categoryId?:'') + '_' + (#minPrice?:'') + '_' + (#maxPrice?:'') + '_' + (#storeId?:'') + '_' + (#minRating?:'') + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Map<String, Object> searchProducts(
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Double minRating,
            org.springframework.data.domain.Pageable pageable) {

        org.springframework.data.jpa.domain.Specification<Product> spec = org.springframework.data.jpa.domain.Specification.where(
                com.project.code.specification.ProductSpecification.hasSkuLike(sku)
        ).and(
                com.project.code.specification.ProductSpecification.hasCategoryId(categoryId)
        ).and(
                com.project.code.specification.ProductSpecification.hasPriceBetween(minPrice, maxPrice)
        ).and(
                com.project.code.specification.ProductSpecification.isAvailableInStore(storeId)
        );

        List<Product> products = productRepository.findAll(spec);

        // Fetch MongoDB ratings and group
        List<com.project.code.Model.Review> reviews = reviewRepository.findAll();
        java.util.Map<Long, List<Integer>> ratingsMap = new java.util.HashMap<>();
        for (com.project.code.Model.Review r : reviews) {
            ratingsMap.computeIfAbsent(r.getProductId(), k -> new java.util.ArrayList<>()).add(r.getRating());
        }

        java.util.Map<Long, Double> avgRatings = new java.util.HashMap<>();
        for (java.util.Map.Entry<Long, List<Integer>> entry : ratingsMap.entrySet()) {
            double avg = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0.0);
            avgRatings.put(entry.getKey(), avg);
        }

        // Filter products in memory by minRating if requested
        if (minRating != null) {
            products = products.stream()
                    .filter(p -> avgRatings.getOrDefault(p.getId(), 0.0) >= minRating)
                    .collect(java.util.stream.Collectors.toList());
        }

        // Manually paginate the list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), products.size());
        List<Product> pageContent = new java.util.ArrayList<>();
        if (start <= products.size()) {
            pageContent = products.subList(start, end);
        }

        org.springframework.data.domain.Page<Product> page = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, products.size()
        );

        Map<String, Object> map = new java.util.HashMap<>();
        map.put("products", page.getContent());
        map.put("currentPage", page.getNumber());
        map.put("totalItems", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        return map;
    }

    @PostMapping
    @Operation(summary = "Add a new product", description = "Create and store a new product in the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Product added successfully")
    @ApiResponse(responseCode = "400", description = "Invalid product data or SKU already exists")
    @CacheEvict(value = {"products", "dashboard", "analytics"}, allEntries = true)
    public Map<String, String> addProduct(@Valid @RequestBody Product product) {

        Map<String, String> map = new HashMap<>();
        if (!serviceClass.validateProduct(product)) {
            map.put("message", "Product already present in database");
            return map;
        }
        try {
            productRepository.save(product);
            map.put("message", "Product added successfully");
        }

        catch (DataIntegrityViolationException e) {
            map.put("message", "SKU should be unique");
        }
        return map;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "Retrieve product details by their database ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved product")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @Cacheable(value = "products", key = "#id")
    public Map<String, Object> getProductbyId(@PathVariable Long id) {
        Map<String, Object> map = new HashMap<>();
        Product result = productRepository.findByid(id);
        if (result == null) {
            throw new com.project.code.exception.NotFoundException("Product not found with ID: " + id);
        }
        map.put("products", result);
        return map;
    }

    @PutMapping
    @Operation(summary = "Update product details", description = "Update details of an existing product in the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Product updated successfully")
    @CacheEvict(value = {"products", "dashboard", "analytics"}, allEntries = true)
    public Map<String, String> updateProduct(@Valid @RequestBody Product product) {
        Map<String, String> map = new HashMap<>();
        try {
            productRepository.save(product);
            map.put("message", "Data updated successfully");
        } catch (Exception e) {
            map.put("message", "Error occurred: " + e.getMessage());
        }

        return map;
    }

    @GetMapping("/category/{name}/{category}")
    @Operation(summary = "Filter products by category and name", description = "Filter products by matching subname and category.")
    @ApiResponse(responseCode = "200", description = "Successfully filtered products")
    @Cacheable(value = "products", key = "'filter_' + #name + '_' + #category")
    public Map<String, Object> filterbyCategoryProduct(@PathVariable String name,@PathVariable String category) {
        Map<String, Object> map = new HashMap<>();

        if(name.equals("null"))
        {
            map.put("products", productRepository.findByCategory(category));
            return map;
        }
        else if(category.equals("null"))
        {
            map.put("products", productRepository.findProductBySubName(name));
            return map;

        }
        map.put("products",productRepository.findProductBySubNameAndCategory(name,category));
        return map;

    }

    @GetMapping
    @Operation(summary = "Get all products with pagination", description = "Retrieve a list of all products in the system using pagination.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved products")
    @Cacheable(value = "products", key = "'list_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Map<String, Object> listProduct(Pageable pageable) {
        Page<Product> page = productRepository.findAll(pageable);
        Map<String, Object> map = new HashMap<>();
        map.put("products", page.getContent());
        map.put("currentPage", page.getNumber());
        map.put("totalItems", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        return map;
    }




    @GetMapping("filter/{category}/{storeid}")
    @Operation(summary = "Get products by category and store ID", description = "Get products matching a specific category in a specific store's inventory.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved products")
    @Cacheable(value = "products", key = "'filter_cat_store_' + #category + '_' + #storeid")
    public Map<String, Object> getProductbyCategoryAndStoreId(@PathVariable String category,@PathVariable long storeid) {
        Map<String, Object> map = new HashMap<>();
        List<Product> result = productRepository.findProductByCategory(category,storeid);

        map.put("product", result);
        return map;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product by ID", description = "Delete a product and its associated inventory and order items from the system. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted product")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @CacheEvict(value = {"products", "dashboard", "analytics"}, allEntries = true)
    public Map<String, String> deleteProduct(@PathVariable Long id) {
        Map<String, String> map = new HashMap<>();

        if (!serviceClass.ValidateProductId(id)) {
            throw new com.project.code.exception.NotFoundException("Product not found with ID: " + id);
        }
        inventoryRepository.deleteByProductId(id);
        orderItemRepository.deleteByProductId(id);
        productRepository.deleteById(id);

        map.put("message", "Deleted product successfully with id: " + id);
        return map;
    }

    @GetMapping("/searchProduct/{name}")
    @Operation(summary = "Search products by name", description = "Retrieve products matching a name pattern.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved search results")
    @Cacheable(value = "products", key = "'search_name_' + #name")
    public Map<String, Object> searchProduct(@PathVariable String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("products", productRepository.findProductBySubName(name));
        return map;
    }

    @Autowired
    private com.project.code.Service.BarcodeService barcodeService;

    @GetMapping("/{id}/barcode")
    @Operation(summary = "Generate barcode for product", description = "Returns a QR code PNG image encoding the product SKU.")
    @ApiResponse(responseCode = "200", description = "Barcode image generated successfully")
    public org.springframework.http.ResponseEntity<byte[]> getProductBarcode(
            @PathVariable Long id,
            @RequestParam(defaultValue = "qr") String type) {
        Product product = productRepository.findByid(id);
        if (product == null) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        try {
            byte[] imageBytes;
            if ("barcode".equalsIgnoreCase(type)) {
                imageBytes = barcodeService.generateBarcode(product.getSku(), 300, 100);
            } else {
                imageBytes = barcodeService.generateQrCode(product.getSku(), 250, 250);
            }
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.IMAGE_PNG);
            headers.setContentLength(imageBytes.length);
            return org.springframework.http.ResponseEntity.ok().headers(headers).body(imageBytes);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.internalServerError().build();
        }
    }

}