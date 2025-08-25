package com.team20.pki.common.model;

import com.team20.pki.util.ValidationPatterns;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @NotEmpty(message = "Email is required")
    @Pattern(
            regexp = ValidationPatterns.EMAIL_REGEX,
            message = "Email must be valid"
    )
    @Column(nullable = false, unique = true)
    private String email;

    @NotNull(message = "Password is required")
    @Column(nullable = false)
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

    @NotNull(message = "User role is required")
    @Column(nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private Role role;

    public enum Role {
        ADMINISTRATOR,
        CA_USER,
        REGULAR_USER,
    }

    public String getFullName(){
        return firstName + " " + lastName;
    }
}