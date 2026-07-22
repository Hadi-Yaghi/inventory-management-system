package com.project.code.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.project.code.tenant.TenantContext;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@MappedSuperclass
@FilterDef(name = "organizationFilter", parameters = @ParamDef(name = "organizationId", type = Long.class))
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
public abstract class TenantEntity {
    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "organization_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Organization organization;

    @PrePersist
    protected void assignOrganization() {
        if (organization == null && TenantContext.getOrganizationId() != null) {
            organization = TenantContext.getOrganization();
        }
    }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
}
