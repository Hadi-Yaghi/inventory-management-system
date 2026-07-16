package com.project.code.Model;

public class AuthResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String username;
    private Role role;
    private java.util.Set<Store> assignedStores;
    private Store defaultStore;

    public AuthResponseDTO() {
    }

    public AuthResponseDTO(String accessToken, String refreshToken, String username, Role role, java.util.Set<Store> assignedStores, Store defaultStore) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.username = username;
        this.role = role;
        this.assignedStores = assignedStores;
        this.defaultStore = defaultStore;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public java.util.Set<Store> getAssignedStores() {
        return assignedStores;
    }

    public void setAssignedStores(java.util.Set<Store> assignedStores) {
        this.assignedStores = assignedStores;
    }

    public Store getDefaultStore() {
        return defaultStore;
    }

    public void setDefaultStore(Store defaultStore) {
        this.defaultStore = defaultStore;
    }
}
