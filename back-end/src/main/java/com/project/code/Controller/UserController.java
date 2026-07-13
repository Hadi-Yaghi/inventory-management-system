package com.project.code.Controller;

import com.project.code.Model.User;
import com.project.code.Repo.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "User Management Controller", description = "Admin-only endpoints for managing users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "Get all registered users", description = "Retrieve a list of all registered users in the system. Accessible by ADMIN only.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list of users")
    @ApiResponse(responseCode = "401", description = "Unauthorized access")
    @ApiResponse(responseCode = "403", description = "Forbidden access")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by ID", description = "Delete a user from the system by their ID. Accessible by ADMIN only.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted user")
    @ApiResponse(responseCode = "401", description = "Unauthorized access")
    @ApiResponse(responseCode = "403", description = "Forbidden access")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new com.project.code.exception.NotFoundException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
