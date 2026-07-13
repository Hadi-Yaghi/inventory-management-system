package com.project.code.Model;

import jakarta.validation.constraints.NotNull;

public class GoogleLoginRequestDTO {

    @NotNull(message = "idToken cannot be empty")
    private String idToken;

    public GoogleLoginRequestDTO() {
    }

    public GoogleLoginRequestDTO(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }
}
