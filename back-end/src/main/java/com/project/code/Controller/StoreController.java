package com.project.code.Controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.project.code.Model.PlaceOrderRequestDTO;
import com.project.code.Model.Store;
import com.project.code.Repo.StoreRepository;
import com.project.code.Service.OrderService;


@RestController
@RequestMapping("/store")
@Tag(name = "Store Controller", description = "Endpoints for managing stores and placing orders")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private OrderService orderService;

    @PostMapping
    @Operation(summary = "Add a new store", description = "Create and save a new store in the system. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Store added successfully")
    public Map<String, String> addStore(@Valid @RequestBody Store store) {
        Store savedStore = storeRepository.save(store);
        Map<String, String> map = new HashMap<>();
        map.put("message", "Store added successfully with id "+ savedStore.getId());
        return map;
    }


    @GetMapping("validate/{storeId}")
    @Operation(summary = "Validate store ID", description = "Check if a store exists by its ID.")
    @ApiResponse(responseCode = "200", description = "True if store exists, false otherwise")
    public boolean validateStore(@PathVariable Long storeId )
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
    public Map<String,String> placeOrder(@Valid @RequestBody PlaceOrderRequestDTO placeOrderRequest) {

        Map<String,String> map=new HashMap<>();
        try{
            orderService.saveOrder(placeOrderRequest);
            map.put("message","Order placed successfully");
        }
        catch(Error e)
        {
            map.put("Error",""+e);

        }
        return map;
    }

}