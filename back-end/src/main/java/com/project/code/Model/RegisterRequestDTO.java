package com.project.code.Model;

import jakarta.validation.constraints.NotNull;

public class RegisterRequestDTO {
    @NotNull(message = "Username cannot be empty")
    private String username;
    @NotNull(message = "Email cannot be empty")
    private String email;
    @NotNull(message = "Password cannot be empty")
    private String password;
    @NotNull(message = "Role cannot be empty")
    private Role role;

    public RegisterRequestDTO() {
    }

    public RegisterRequestDTO(String username, String email, String password, Role role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
