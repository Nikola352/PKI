package com.team20.pki.authentication.model;

import com.team20.pki.common.model.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @NotEmpty
    @Column(nullable = false, length = 64)
    private String token;

    @NotEmpty
    @Column(nullable = false)
    private String sessionId;

    @NotNull
    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    private Instant expirationTime;

    @NotNull
    @Column(nullable = false)
    private Boolean revoked;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
