package com.project.code.config;

import com.project.code.Model.Organization;
import com.project.code.Repo.OrganizationRepository;
import com.project.code.Repo.ReviewRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Assigns pre-SaaS records to a default organization after Hibernate adds organization_id columns. */
@Component
@Order(-100)
public class TenantDataMigrationRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(TenantDataMigrationRunner.class);

    private final OrganizationRepository organizations;
    private final ReviewRepository reviews;
    private final EntityManager entityManager;

    public TenantDataMigrationRunner(OrganizationRepository organizations, ReviewRepository reviews, EntityManager entityManager) {
        this.organizations = organizations;
        this.reviews = reviews;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(String... args) {
        try {
            Organization legacy = organizations.findBySlug("default-organization").orElseGet(() -> {
                Organization organization = new Organization();
                organization.setName("Default Organization");
                organization.setSlug("default-organization");
                return organizations.save(organization);
            });

            String[] tableNames = {
                "users", "store", "category", "supplier", "customer", "product", "product_image",
                "inventory", "order_details", "order_item", "return_request", "stock_transfer",
                "inventory_adjustment", "notification", "activity_log", "purchase_order", "purchase_order_item"
            };

            for (String table : tableNames) {
                try {
                    int updated = entityManager.createNativeQuery(
                        "UPDATE " + table + " SET organization_id = :orgId WHERE organization_id IS NULL"
                    ).setParameter("orgId", legacy.getId()).executeUpdate();
                    if (updated > 0) {
                        log.info("Migrated {} rows in table '{}' to organizationId {}", updated, table, legacy.getId());
                    }
                } catch (Exception e) {
                    log.warn("Notice: Table '{}' migration check skipped: {}", table, e.getMessage());
                }
            }

            reviews.findAll().forEach(review -> {
                if (review.getOrganizationId() == null) {
                    review.setOrganizationId(legacy.getId());
                    reviews.save(review);
                }
            });
        } catch (Exception e) {
            log.error("TenantDataMigrationRunner execution completed with warnings: {}", e.getMessage());
        }
    }
}
