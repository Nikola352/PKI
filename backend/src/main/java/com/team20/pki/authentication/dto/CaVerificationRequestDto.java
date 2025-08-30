package com.team20.pki.authentication.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Value;

@Value
public class CaVerificationRequestDto {
    @NotEmpty
    String verificationCode;

    @NotNull(message = "Password is required")
    @Size.List({
            @Size(min = 8, message = "Password must be at least 8 characters long"),
            @Size(max = 128, message = "Maximum password length is 128 characters")
    })
    String password;
}
