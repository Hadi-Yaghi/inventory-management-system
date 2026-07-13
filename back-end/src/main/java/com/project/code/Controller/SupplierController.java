package com.project.code.Controller;

import com.project.code.Model.Supplier;
import com.project.code.Repo.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/supplier")
@Tag(name = "Supplier Controller", description = "Endpoints for supplier management")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    @Operation(summary = "Get all suppliers", description = "Retrieve a list of all suppliers in the system.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved suppliers")
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID", description = "Retrieve supplier details by their ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved supplier")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a supplier", description = "Create and save a new supplier. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully created supplier")
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody Supplier supplier) {
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @PutMapping
    @Operation(summary = "Update supplier", description = "Update an existing supplier's details. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully updated supplier")
    public ResponseEntity<Supplier> updateSupplier(@Valid @RequestBody Supplier supplier) {
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete supplier by ID", description = "Delete a supplier from the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted supplier")
    @ApiResponse(responseCode = "404", description = "Supplier not found")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new com.project.code.exception.NotFoundException("Supplier not found with ID: " + id);
        }
        supplierRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
