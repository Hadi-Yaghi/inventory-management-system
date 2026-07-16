package com.project.code.security;

import com.project.code.Model.Role;
import com.project.code.Model.Store;
import com.project.code.Model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class CustomUserDetails implements UserDetails {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public Set<Long> getAssignedStoreIds() {
        if (user.getRole() == Role.ADMIN) {
            return Collections.emptySet();
        }
        return user.getAssignedStores().stream()
                .map(Store::getId)
                .collect(Collectors.toSet());
    }

    public Long getDefaultStoreId() {
        return user.getDefaultStore() != null ? user.getDefaultStore().getId() : null;
    }
}
