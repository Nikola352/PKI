package com.team20.pki.authentication.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Value;

@Value
public class LoginRequestDto {
    @NotEmpty(message = "Email is required")
    String email;

    @NotEmpty(message = "Password is required")
    String password;
}
