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

    @PostMapping
    @Operation(summary = "Add a new product", description = "Create and store a new product in the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Product added successfully")
    @ApiResponse(responseCode = "400", description = "Invalid product data or SKU already exists")
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
    public Map<String, Object> getProductbyId(@PathVariable Long id) {
        System.out.println("result: ");
        System.out.println("result: ");
        System.out.println("result: ");
        Map<String, Object> map = new HashMap<>();
        Product result = productRepository.findByid(id);

        System.out.println("result: "+result);
        map.put("products", result);
        return map;
    }

    @PutMapping
    @Operation(summary = "Update product details", description = "Update details of an existing product in the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Product updated successfully")
    public Map<String, String> updateProduct(@Valid @RequestBody Product product) {
        Map<String, String> map = new HashMap<>();
        try {
            productRepository.save(product);
            map.put("message", "Data upated sucessfully");
        } catch (Error e) {
            map.put("message", "Error occured");
        }

        return map;
    }

    @GetMapping("/category/{name}/{category}")
    @Operation(summary = "Filter products by category and name", description = "Filter products by matching subname and category.")
    @ApiResponse(responseCode = "200", description = "Successfully filtered products")
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
    public Map<String, Object> getProductbyCategoryAndStoreId(@PathVariable String category,@PathVariable long storeid) {
        Map<String, Object> map = new HashMap<>();
        List<Product> result = productRepository.findProductByCategory(category,storeid);

        map.put("product", result);
        return map;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product by ID", description = "Delete a product and its associated inventory and order items from the system. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted product")
    public Map<String, String> deleteProduct(@PathVariable Long id) {
        Map<String, String> map = new HashMap<>();

        if (!serviceClass.ValidateProductId(id)) {
            map.put("message", "Id " + id + " not present in database");
            return map;
        }
        inventoryRepository.deleteByProductId(id);
        orderItemRepository.deleteById(id);
        productRepository.deleteById(id);

        map.put("message", "Deleted product successfully with id: " + id);
        return map;
    }

    @GetMapping("/searchProduct/{name}")
    @Operation(summary = "Search products by name", description = "Retrieve products matching a name pattern.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved search results")
    public Map<String, Object> searchProduct(@PathVariable String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("products", productRepository.findProductBySubName(name));
        return map;
    }


}