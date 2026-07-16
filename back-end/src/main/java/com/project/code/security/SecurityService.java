package com.project.code.security;

import com.project.code.Model.Role;
import com.project.code.Model.User;
import com.project.code.Repo.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SecurityService {

    private final UserRepository userRepository;

    public SecurityService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            return userRepository.findByUsernameWithStores(username)
                    .orElseThrow(() -> new AccessDeniedException("User not found: " + username));
        }
        throw new AccessDeniedException("User is not authenticated");
    }

    public boolean isUserAdmin() {
        try {
            User user = getCurrentUser();
            return user.getRole() == Role.ADMIN;
        } catch (Exception e) {
            return false;
        }
    }

    public Set<Long> getAssignedStoreIds() {
        User user = getCurrentUser();
        if (user.getRole() == Role.ADMIN) {
            return Collections.emptySet();
        }
        return user.getAssignedStores().stream()
                .map(store -> store.getId())
                .collect(Collectors.toSet());
    }

    public void verifyStoreAccess(Long storeId) {
        if (storeId == null) {
            return;
        }
        User user = getCurrentUser();
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        boolean hasAccess = user.getAssignedStores().stream()
                .anyMatch(store -> Long.valueOf(store.getId()).equals(storeId));
        if (!hasAccess) {
            throw new AccessDeniedException("Access denied: You do not have access to store ID " + storeId);
        }
    }
}
