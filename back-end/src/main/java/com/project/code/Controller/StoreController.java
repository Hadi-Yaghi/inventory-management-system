package com.project.code.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.project.code.Model.PlaceOrderRequestDTO;
import com.project.code.Model.Store;
import com.project.code.Repo.StoreRepository;
import com.project.code.Service.OrderService;
import com.project.code.exception.NotFoundException;


@RestController
@RequestMapping("/store")
@Tag(name = "Store Controller", description = "Endpoints for managing stores and placing orders")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private OrderService orderService;

    @GetMapping
    @Operation(summary = "Get all stores", description = "Retrieve a list of all stores in the system.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved stores")
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @PostMapping
    @Operation(summary = "Add a new store", description = "Create and save a new store in the system. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Store added successfully")
    public Map<String, String> addStore(@Valid @RequestBody Store store) {
        Store savedStore = storeRepository.save(store);
        Map<String, String> map = new HashMap<>();
        map.put("message", "Store added successfully with id "+ savedStore.getId());
        return map;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete store by ID", description = "Delete a store from the system. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted store")
    @ApiResponse(responseCode = "404", description = "Store not found")
    public ResponseEntity<Map<String, String>> deleteStore(@PathVariable Long id) {
        if (!storeRepository.existsById(id)) {
            throw new NotFoundException("Store not found with ID: " + id);
        }
        storeRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Store deleted successfully with id: " + id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("validate/{storeId}")
    @Operation(summary = "Validate store ID", description = "Check if a store exists by its ID.")
    @ApiResponse(responseCode = "200", description = "True if store exists, false otherwise")
    public boolean validateStore(@PathVariable Long storeId)
    {
        Store store=storeRepository.findByid(storeId);
        if(store!=null)
        {
            return true;
        }
        return false;
    }


    @PostMapping("/placeOrder")
    @Operation(summary = "Place a new order", description = "Place a new order for a store, including customer details and products to purchase. Accessible by ADMIN, MANAGER, and EMPLOYEE.")
    @ApiResponse(responseCode = "200", description = "Order placed successfully")
    public ResponseEntity<Map<String,String>> placeOrder(@Valid @RequestBody PlaceOrderRequestDTO placeOrderRequest) {

        Map<String,String> map=new HashMap<>();
        try{
            orderService.saveOrder(placeOrderRequest);
            map.put("message","Order placed successfully");
            return ResponseEntity.ok(map);
        }
        catch(com.project.code.exception.InsufficientStockException e)
        {
            map.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(map);
        }
        catch(Exception e)
        {
            map.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(map);
        }
    }

}