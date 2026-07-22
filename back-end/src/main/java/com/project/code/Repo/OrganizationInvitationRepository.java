package com.project.code.Repo;
import com.project.code.Model.OrganizationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface OrganizationInvitationRepository extends JpaRepository<OrganizationInvitation, Long> {
    Optional<OrganizationInvitation> findByToken(String token);
    java.util.List<OrganizationInvitation> findByOrganizationIdAndAcceptedAtIsNull(Long organizationId);
}
