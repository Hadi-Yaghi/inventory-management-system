package com.project.code.Controller;

import com.project.code.Model.Customer;
import com.project.code.Repo.CustomerRepository;
import com.project.code.security.SecurityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/customers")
@Tag(name = "Customer Controller", description = "Endpoints for managing customers")
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SecurityService securityService;

    @GetMapping
    @Operation(summary = "Get all customers", description = "Get list of customers. Managers and employees can only see customers who ordered at their stores.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved customers list")
    public ResponseEntity<List<Customer>> getAllCustomers() {
        if (securityService.isUserAdmin()) {
            return ResponseEntity.ok(customerRepository.findAll());
        } else {
            Set<Long> storeIds = securityService.getAssignedStoreIds();
            return ResponseEntity.ok(customerRepository.findCustomersByStores(storeIds));
        }
    }

    @PostMapping
    @Operation(summary = "Create customer", description = "Register a new customer in the system.")
    @ApiResponse(responseCode = "200", description = "Customer created successfully")
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        Customer existing = customerRepository.findByEmail(customer.getEmail());
        if (existing != null) {
            return ResponseEntity.ok(existing);
        }
        return ResponseEntity.ok(customerRepository.save(customer));
    }
}
