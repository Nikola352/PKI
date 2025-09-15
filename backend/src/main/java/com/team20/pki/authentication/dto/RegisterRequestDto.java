package com.team20.pki.authentication.dto;

import com.team20.pki.util.ValidationPatterns;
import jakarta.validation.constraints.*;
import lombok.Value;

@Value
public class RegisterRequestDto {
    @NotEmpty(message = "Email is required")
    @Pattern(
            regexp = ValidationPatterns.EMAIL_REGEX,
            message = "Email must be valid"
    )
    String email;

    @NotNull(message = "Password is required")
    @Size.List({
            @Size(min = 8, message = "Password must be at least 8 characters long"),
            @Size(max = 128, message = "Maximum password length is 128 characters")
    })
    String password;

    @NotEmpty(message = "First name is required")
    String firstName;

    @NotEmpty(message = "Last name is required")
    String lastName;

    @NotEmpty(message = "Organization name is required")
    String organization;
}
