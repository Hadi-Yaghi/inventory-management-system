package com.project.code.Controller;

import com.project.code.Model.Category;
import com.project.code.Repo.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category")
@Tag(name = "Category Controller", description = "Endpoints for category management")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    @Operation(summary = "Get all categories", description = "Retrieve a list of all categories in the system.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID", description = "Retrieve category details by their ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved category")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return categoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create a category", description = "Create and save a new category. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully created category")
    @CacheEvict(value = "categories", allEntries = true)
    public ResponseEntity<Category> createCategory(@Valid @RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @PutMapping
    @Operation(summary = "Update category", description = "Update an existing category's details. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully updated category")
    @CacheEvict(value = "categories", allEntries = true)
    public ResponseEntity<Category> updateCategory(@Valid @RequestBody Category category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete category by ID", description = "Delete a category from the database. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted category")
    @ApiResponse(responseCode = "404", description = "Category not found")
    @CacheEvict(value = "categories", allEntries = true)
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new com.project.code.exception.NotFoundException("Category not found with ID: " + id);
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
