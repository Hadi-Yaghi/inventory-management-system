package com.project.code.Controller;

import com.project.code.Model.*;
import com.project.code.Repo.OrganizationInvitationRepository;
import com.project.code.Repo.OrganizationRepository;
import com.project.code.Repo.UserRepository;
import com.project.code.Service.EmailService;
import com.project.code.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public OrganizationController(
            OrganizationRepository organizationRepository,
            OrganizationInvitationRepository invitationRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.organizationRepository = organizationRepository;
        this.invitationRepository = invitationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @GetMapping("/current")
    public Organization current() {
        return TenantContext.requireOrganization();
    }

    @PutMapping("/current")
    @Transactional
    public Organization update(@RequestBody Organization changes) {
        Organization organization = TenantContext.requireOrganization();
        if (changes.getName() != null && !changes.getName().isBlank()) {
            organization.setName(changes.getName().trim());
        }
        if (changes.getContactEmail() != null) {
            organization.setContactEmail(changes.getContactEmail().trim());
        }
        if (changes.getTimezone() != null && !changes.getTimezone().isBlank()) {
            organization.setTimezone(changes.getTimezone().trim());
        }
        return organizationRepository.save(organization);
    }

    @GetMapping("/members")
    public List<User> members() {
        Organization organization = TenantContext.requireOrganization();
        return userRepository.findByOrganizationId(organization.getId());
    }

    @PostMapping("/invitations")
    @Transactional
    public ResponseEntity<Map<String, String>> invite(@Valid @RequestBody CreateInvitationRequestDTO request) {
        Organization organization = TenantContext.requireOrganization();
        
        OrganizationInvitation invitation = new OrganizationInvitation();
        invitation.setOrganization(organization);
        invitation.setEmail(request.getEmail().trim().toLowerCase());
        invitation.setRole(request.getRole() == null ? Role.EMPLOYEE : request.getRole());
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
        invitationRepository.save(invitation);

        try {
            emailService.sendInvitationEmail(
                    invitation.getEmail(),
                    organization.getName(),
                    invitation.getRole().name(),
                    invitation.getToken()
            );
        } catch (Exception e) {
            System.err.println("Email dispatch notice: " + e.getMessage());
        }
        
        return ResponseEntity.ok(Map.of(
                "message", "Invitation created and email dispatched",
                "token", invitation.getToken(),
                "acceptPath", "/signup?token=" + invitation.getToken()
        ));
    }

    @GetMapping("/invitations")
    public List<OrganizationInvitation> listInvitations() {
        Organization organization = TenantContext.requireOrganization();
        return invitationRepository.findByOrganizationIdAndAcceptedAtIsNull(organization.getId());
    }

    @DeleteMapping("/invitations/{id}")
    @Transactional
    public ResponseEntity<Map<String, String>> revokeInvitation(@PathVariable Long id) {
        Organization organization = TenantContext.requireOrganization();
        OrganizationInvitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (!invitation.getOrganization().getId().equals(organization.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        invitationRepository.delete(invitation);
        return ResponseEntity.ok(Map.of("message", "Invitation revoked successfully"));
    }

    @GetMapping("/public/invitation/{token}")
    public ResponseEntity<Map<String, String>> getPublicInvitationDetails(@PathVariable String token) {
        OrganizationInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (invitation.getAcceptedAt() != null || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation is expired or already used");
        }

        return ResponseEntity.ok(Map.of(
                "organizationName", invitation.getOrganization().getName(),
                "email", invitation.getEmail(),
                "role", invitation.getRole().name()
        ));
    }
}
