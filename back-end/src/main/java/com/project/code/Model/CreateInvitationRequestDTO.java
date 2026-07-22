package com.project.code.Model;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
public class CreateInvitationRequestDTO {
    @Email @NotNull private String email;
    @NotNull private Role role;
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
