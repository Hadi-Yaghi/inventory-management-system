package com.project.code.Controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.project.code.Model.*;
import com.project.code.Repo.OrganizationInvitationRepository;
import com.project.code.Repo.OrganizationRepository;
import com.project.code.Repo.UserRepository;
import com.project.code.Service.GoogleTokenVerifierService;
import com.project.code.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication Controller", description = "Endpoints for user registration and login")
public class AuthController {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationInvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    public AuthController(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            OrganizationInvitationRepository invitationRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            GoogleTokenVerifierService googleTokenVerifierService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.invitationRepository = invitationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Register a new user creating a new Organization or joining via an invitation token.")
    @ApiResponse(responseCode = "200", description = "User registered successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input or username/email already taken")
    @Transactional
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequestDTO request) {
        Map<String, String> response = new HashMap<>();

        if (userRepository.existsByUsername(request.getUsername())) {
            response.put("message", "Username is already taken");
            return ResponseEntity.badRequest().body(response);
        }

        Organization organization;
        Role assignedRole;
        String userEmail = request.getEmail();

        if (request.getInvitationToken() != null && !request.getInvitationToken().isBlank()) {
            OrganizationInvitation invitation = invitationRepository.findByToken(request.getInvitationToken().trim())
                    .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired invitation token"));
            if (invitation.getAcceptedAt() != null || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                response.put("message", "Invitation is expired or already used");
                return ResponseEntity.badRequest().body(response);
            }
            organization = invitation.getOrganization();
            assignedRole = invitation.getRole();
            if (userEmail == null || userEmail.isBlank()) {
                userEmail = invitation.getEmail();
            }
            invitation.setAcceptedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
        } else {
            if (request.getOrganizationName() == null || request.getOrganizationName().isBlank()) {
                response.put("message", "Organization name is required when not registering via invitation");
                return ResponseEntity.badRequest().body(response);
            }
            String baseSlug = request.getOrganizationName().trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
            if (baseSlug.isBlank()) baseSlug = "org-" + System.currentTimeMillis();
            String slug = baseSlug;
            int counter = 1;
            while (organizationRepository.existsBySlug(slug)) {
                slug = baseSlug + "-" + counter++;
            }
            organization = new Organization();
            organization.setName(request.getOrganizationName().trim());
            organization.setSlug(slug);
            organization.setContactEmail(userEmail);
            organization = organizationRepository.save(organization);
            assignedRole = Role.ADMIN;
        }

        if (userRepository.existsByEmail(userEmail)) {
            response.put("message", "Email is already taken");
            return ResponseEntity.badRequest().body(response);
        }

        User user = new User(
                request.getUsername(),
                userEmail,
                passwordEncoder.encode(request.getPassword()),
                assignedRole
        );
        user.setOrganization(organization);
        userRepository.save(user);

        response.put("message", "User registered successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get tokens", description = "Validate user credentials and return access and refresh tokens.")
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

        Long organizationId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name(), organizationId);
        String refreshToken = jwtService.generateRefreshToken(user.getUsername(), organizationId);

        return ResponseEntity.ok(new AuthResponseDTO(
                accessToken,
                refreshToken,
                user.getUsername(),
                user.getRole(),
                user.getAssignedStores(),
                user.getDefaultStore(),
                user.getOrganization()
        ));
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate via Google ID token", description = "Validate Google ID token for authenticated user.")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequestDTO request) {
        GoogleIdToken idToken = googleTokenVerifierService.verifyToken(request.getIdToken());
        if (idToken == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid Google ID token");
            return ResponseEntity.badRequest().body(response);
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();

        User user = userRepository.findByEmail(email).orElseThrow(() ->
            new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use an organization invitation or register before signing in with Google.")
        );

        user = userRepository.findByUsernameWithStores(user.getUsername()).orElse(user);

        String accessToken = jwtService.generateAccessToken(user.getUsername(), user.getRole().name(), user.getOrganization().getId());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername(), user.getOrganization().getId());

        return ResponseEntity.ok(new AuthResponseDTO(
                accessToken,
                refreshToken,
                user.getUsername(),
                user.getRole(),
                user.getAssignedStores(),
                user.getDefaultStore(),
                user.getOrganization()
        ));
    }

    @PostMapping("/accept-invitation")
    @Transactional
    public ResponseEntity<Map<String, String>> acceptInvitation(@Valid @RequestBody AcceptInvitationRequestDTO request) {
        OrganizationInvitation invitation = invitationRepository.findByToken(request.getToken())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (invitation.getAcceptedAt() != null || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation is no longer valid");
        }
        if (userRepository.existsByUsername(request.getUsername()) || userRepository.existsByEmail(invitation.getEmail())) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Username or email is already registered");
        }
        User user = new User(request.getUsername(), invitation.getEmail(), passwordEncoder.encode(request.getPassword()), invitation.getRole());
        user.setOrganization(invitation.getOrganization());
        userRepository.save(user);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
        return ResponseEntity.ok(Map.of("message", "Invitation accepted. You can now sign in."));
    }
}
