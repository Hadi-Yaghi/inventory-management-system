package com.project.code.security;

import com.project.code.Model.ActivityLog;
import com.project.code.Repo.ActivityLogRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring AOP aspect that intercepts CREATE / UPDATE / DELETE service-level
 * methods on Product, Inventory, Store, and Order entities.
 * It captures the authenticated user from the JWT security context and
 * persists an ActivityLog record for each auditable action.
 */
@Aspect
@Component
public class ActivityLoggingAspect {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    // ── Product mutations ────────────────────────────────────────────────
    @Around("execution(* com.project.code.Controller.ProductController.addProduct(..))")
    public Object logProductCreate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        Object[] args = jp.getArgs();
        if (args.length > 0) {
            com.project.code.Model.Product p = (com.project.code.Model.Product) args[0];
            log("CREATE", "Product", String.valueOf(p.getId()), "Created product: " + p.getName() + " (SKU: " + p.getSku() + ")");
        }
        return result;
    }

    @Around("execution(* com.project.code.Controller.ProductController.updateProduct(..))")
    public Object logProductUpdate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        Object[] args = jp.getArgs();
        if (args.length > 0) {
            com.project.code.Model.Product p = (com.project.code.Model.Product) args[0];
            log("UPDATE", "Product", String.valueOf(p.getId()), "Updated product: " + p.getName() + " (SKU: " + p.getSku() + ")");
        }
        return result;
    }

    @Around("execution(* com.project.code.Controller.ProductController.deleteProduct(..))")
    public Object logProductDelete(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        Object[] args = jp.getArgs();
        if (args.length > 0) {
            log("DELETE", "Product", String.valueOf(args[0]), "Deleted product with id: " + args[0]);
        }
        return result;
    }

    // ── Inventory mutations ──────────────────────────────────────────────
    @Around("execution(* com.project.code.Controller.InventoryController.add*(..))")
    public Object logInventoryCreate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        log("CREATE", "Inventory", "-", "Inventory record created via " + jp.getSignature().getName());
        return result;
    }

    @Around("execution(* com.project.code.Controller.InventoryController.update*(..))")
    public Object logInventoryUpdate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        log("UPDATE", "Inventory", "-", "Inventory record updated via " + jp.getSignature().getName());
        return result;
    }

    // ── Store mutations ──────────────────────────────────────────────────
    @Around("execution(* com.project.code.Controller.StoreController.add*(..))")
    public Object logStoreCreate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        log("CREATE", "Store", "-", "Store created via " + jp.getSignature().getName());
        return result;
    }

    // ── Order mutations ──────────────────────────────────────────────────
    // Order creation, status change, and purchase order receiving/cancellation logs have been refactored to Event Listeners (ActivityLoggingListener)

    // ── Purchase Order mutations ───────────────────────────────────────────
    @Around("execution(* com.project.code.Controller.PurchaseOrderController.createPurchaseOrder(..))")
    public Object logPurchaseOrderCreate(ProceedingJoinPoint jp) throws Throwable {
        Object result = jp.proceed();
        if (result instanceof org.springframework.http.ResponseEntity) {
            Object body = ((org.springframework.http.ResponseEntity<?>) result).getBody();
            if (body instanceof com.project.code.Model.PurchaseOrder) {
                com.project.code.Model.PurchaseOrder po = (com.project.code.Model.PurchaseOrder) body;
                log("CREATE", "PurchaseOrder", String.valueOf(po.getId()), "Created purchase order ID: " + po.getId() + " (Supplier: " + (po.getSupplier() != null ? po.getSupplier().getName() : "N/A") + ")");
            }
        }
        return result;
    }



    // ── Helper ───────────────────────────────────────────────────────────
    private void log(String action, String entityType, String entityId, String details) {
        String userId = "ANONYMOUS";
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                userId = auth.getName();
            }
        } catch (Exception ignored) {
        }

        try {
            ActivityLog entry = new ActivityLog(userId, action, entityType, entityId, details);
            activityLogRepository.save(entry);
        } catch (Exception e) {
            System.err.println("ActivityLoggingAspect: failed to save log - " + e.getMessage());
        }
    }
}
