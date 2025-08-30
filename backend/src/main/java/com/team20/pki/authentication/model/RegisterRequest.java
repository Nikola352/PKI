package com.team20.pki.authentication.model;

import com.team20.pki.common.model.User;
import com.team20.pki.util.ValidationPatterns;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "register_requests",
        indexes = {
                @Index(name = "idx_register_request_verification_code", columnList = "verificationCode", unique = true),
                @Index(name = "idx_register_request_expiration", columnList = "expirationTime"),
        }
)
public class RegisterRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @NotEmpty
    @Column(nullable = false, unique = true)
    private String verificationCode;

    @NotNull
    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    private Instant expirationTime;

    @NotEmpty(message = "Email is required")
    @Pattern(
            regexp = ValidationPatterns.EMAIL_REGEX,
            message = "Email must be valid"
    )
    @Column(nullable = false)
    private String email;

    // only for regular user requests (self sign-up)
    private String password;

    @NotEmpty(message = "First name is required")
    @Column(nullable = false)
    private String firstName;

    @NotEmpty(message = "Last name is required")
    @Column(nullable = false)
    private String lastName;

    @NotEmpty(message = "Organization name is required")
    @Column(nullable = false)
    private String organization;

    @NotNull(message = "Role is required")
    @Column(nullable = false)
    private User.Role role;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}