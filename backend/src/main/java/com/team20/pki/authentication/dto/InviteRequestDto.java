package com.team20.pki.authentication.dto;

import com.team20.pki.util.ValidationPatterns;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Value;

@Value
public class InviteRequestDto {
    @NotEmpty(message = "Email is required")
    @Pattern(
            regexp = ValidationPatterns.EMAIL_REGEX,
            message = "Email must be valid"
    )
    String email;

    @NotEmpty(message = "First name is required")
    String firstName;

    @NotEmpty(message = "Last name is required")
    String lastName;

    @NotEmpty(message = "Organization name is required")
    String organization;
}
