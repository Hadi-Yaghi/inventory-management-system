package com.project.code.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

/** Enables the Hibernate organization filter for SQL repository operations. */
@Aspect
@Component
public class TenantRepositoryAspect {
    @PersistenceContext private EntityManager entityManager;

    @Around("execution(* com.project.code.Repo..*(..)) && !execution(* com.project.code.Repo.OrganizationRepository.*(..)) && !execution(* com.project.code.Repo.OrganizationInvitationRepository.*(..)) && !execution(* com.project.code.Repo.UserRepository.*(..))")
    public Object scopeRepositoryToOrganization(ProceedingJoinPoint joinPoint) throws Throwable {
        Long organizationId = TenantContext.getOrganizationId();
        if (organizationId != null) {
            entityManager.unwrap(Session.class)
                    .enableFilter("organizationFilter")
                    .setParameter("organizationId", organizationId);
        }
        return joinPoint.proceed();
    }
}
