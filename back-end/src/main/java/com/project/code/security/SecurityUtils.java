package com.project.code.security;

import com.project.code.Model.Role;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Set;

public class SecurityUtils {

    public static Set<Long> getCurrentUserStoreIds() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return Collections.emptySet();
        }

        jakarta.servlet.http.HttpServletRequest request = null;
        String activeStoreHeader = null;
        try {
            org.springframework.web.context.request.RequestAttributes attribs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attribs instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                request = ((org.springframework.web.context.request.ServletRequestAttributes) attribs).getRequest();
                if (request != null) {
                    activeStoreHeader = request.getHeader("X-Active-Store-ID");
                }
            }
        } catch (Exception e) {
            // No active request context
        }

        Long headerStoreId = null;
        if (activeStoreHeader != null && !activeStoreHeader.trim().isEmpty()) {
            try {
                headerStoreId = Long.parseLong(activeStoreHeader.trim());
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails) {
            CustomUserDetails details = (CustomUserDetails) principal;
            if (details.getUser().getRole() == Role.ADMIN) {
                if (headerStoreId != null) {
                    return Collections.singleton(headerStoreId);
                }
                return null; // ADMIN has no store filters by default
            }
            if (headerStoreId != null && details.getAssignedStoreIds().contains(headerStoreId)) {
                return Collections.singleton(headerStoreId);
            }
            return details.getAssignedStoreIds();
        }
        return Collections.emptySet();
    }
}
