package com.project.code.tenant;

import com.project.code.Model.Organization;
import org.springframework.security.access.AccessDeniedException;

public final class TenantContext {
    private static final ThreadLocal<Long> ORGANIZATION_ID = new ThreadLocal<>();
    private static final ThreadLocal<Organization> ORGANIZATION = new ThreadLocal<>();

    private TenantContext() { }

    public static void setOrganizationId(Long id) { ORGANIZATION_ID.set(id); }
    public static Long getOrganizationId() { return ORGANIZATION_ID.get(); }

    public static void setOrganization(Organization organization) {
        ORGANIZATION.set(organization);
        if (organization != null) {
            ORGANIZATION_ID.set(organization.getId());
        } else {
            ORGANIZATION_ID.remove();
        }
    }

    public static Organization getOrganization() {
        return ORGANIZATION.get();
    }

    public static Organization requireOrganization() {
        Organization organization = ORGANIZATION.get();
        if (organization == null) throw new AccessDeniedException("No organization is associated with this request");
        return organization;
    }

    public static void clear() { ORGANIZATION.remove(); ORGANIZATION_ID.remove(); }
}
