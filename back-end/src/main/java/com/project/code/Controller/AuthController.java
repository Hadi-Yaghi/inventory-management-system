package com.project.code.Controller;

import com.project.code.Model.*;
import com.project.code.Repo.UserRepository;
import com.project.code.security.JwtService;
import com.project.code.Service.GoogleTokenVerifierService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication Controller", description = "Endpoints for user registration and login")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            GoogleTokenVerifierService googleTokenVerifierService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Register a new user in the system with a specified role (ADMIN, MANAGER, EMPLOYEE).")
    @ApiResponse(responseCode = "200", description = "User registered successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input or username/email already taken")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequestDTO request) {
        Map<String, String> response = new HashMap<>();

        if (userRepository.existsByUsername(request.getUsername())) {
            response.put("message", "Username is already taken");
            return ResponseEntity.badRequest().body(response);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            response.put("message", "Email is already taken");
            return ResponseEntity.badRequest().body(response);
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole()
        );
        userRepository.save(user);

        response.put("message", "User registered successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get tokens", description = "Validate user credentials and return an access token (JWT) and a refresh token.")
    @ApiResponse(responseCode = "200", description = "Authentication successful, tokens returned")
    @ApiResponse(responseCode = "401", description = "Invalid username or password")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByUsernameWithStores(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return ResponseEntity.ok(new AuthResponseDTO(accessToken, refreshToken, user.getUsername(), user.getRole(), user.getAssignedStores(), user.getDefaultStore()));
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate or register via Google ID token", description = "Validate Google ID token, log in existing users, or auto-register new users as EMPLOYEE.")
    @ApiResponse(responseCode = "200", description = "Authentication successful, tokens returned")
    @ApiResponse(responseCode = "400", description = "Invalid Google ID token")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequestDTO request) {
        GoogleIdToken idToken = googleTokenVerifierService.verifyToken(request.getIdToken());
        if (idToken == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid Google ID token");
            return ResponseEntity.badRequest().body(response);
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            String uniqueUsername = email;
            if (userRepository.existsByUsername(uniqueUsername)) {
                uniqueUsername = email.split("@")[0] + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            }
            String unusablePasswordHash = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
            User newUser = new User(
                    uniqueUsername,
                    email,
                    unusablePasswordHash,
                    Role.EMPLOYEE,
                    "GOOGLE"
            );
            return userRepository.save(newUser);
        });

        // Reload with store assignments after potential save
        user = userRepository.findByUsernameWithStores(user.getUsername()).orElse(user);

        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return ResponseEntity.ok(new AuthResponseDTO(accessToken, refreshToken, user.getUsername(), user.getRole(), user.getAssignedStores(), user.getDefaultStore()));
    }
}
