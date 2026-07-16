package com.project.code.Controller;

import com.project.code.Model.Role;
import com.project.code.Model.User;
import com.project.code.Repo.StoreRepository;
import com.project.code.Repo.UserRepository;
import com.project.code.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@Tag(name = "User Management Controller", description = "Admin-only endpoints for managing users")
public class UserController {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, StoreRepository storeRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @Operation(summary = "Get all registered users", description = "Retrieve a list of all registered users in the system. Accessible by ADMIN only.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list of users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    @Operation(summary = "Create user", description = "Admin creates a new user with store assignments. Accessible by ADMIN only.")
    public ResponseEntity<Map<String, String>> createUser(@RequestBody UserAdminRequest req) {
        Map<String, String> response = new HashMap<>();
        if (userRepository.existsByUsername(req.username)) {
            response.put("message", "Username is already taken");
            return ResponseEntity.badRequest().body(response);
        }
        if (userRepository.existsByEmail(req.email)) {
            response.put("message", "Email is already taken");
            return ResponseEntity.badRequest().body(response);
        }

        User user = new User();
        user.setUsername(req.username);
        user.setEmail(req.email);
        user.setPasswordHash(passwordEncoder.encode(req.password));
        user.setRole(req.role);
        user.setAuthProvider("LOCAL");

        if (req.defaultStoreId != null) {
            user.setDefaultStore(storeRepository.findById(req.defaultStoreId).orElse(null));
        }
        if (req.storeIds != null) {
            user.setAssignedStores(new HashSet<>(storeRepository.findAllById(req.storeIds)));
        }

        userRepository.save(user);
        response.put("message", "User created successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Admin edits an existing user with store assignments. Accessible by ADMIN only.")
    public ResponseEntity<Map<String, String>> updateUser(@PathVariable Long id, @RequestBody UserAdminRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + id));

        user.setUsername(req.username);
        user.setEmail(req.email);
        if (req.password != null && !req.password.isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password));
        }
        user.setRole(req.role);

        if (req.defaultStoreId != null) {
            user.setDefaultStore(storeRepository.findById(req.defaultStoreId).orElse(null));
        } else {
            user.setDefaultStore(null);
        }

        if (req.storeIds != null) {
            user.setAssignedStores(new HashSet<>(storeRepository.findAllById(req.storeIds)));
        } else {
            user.getAssignedStores().clear();
        }

        userRepository.save(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User updated successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by ID", description = "Delete a user from the system by their ID. Accessible by ADMIN only.")
    @ApiResponse(responseCode = "200", description = "Successfully deleted user")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    public static class UserAdminRequest {
        public String username;
        public String email;
        public String password;
        public Role role;
        public List<Long> storeIds;
        public Long defaultStoreId;
    }
}
