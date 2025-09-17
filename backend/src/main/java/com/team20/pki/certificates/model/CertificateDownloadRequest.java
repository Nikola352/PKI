package com.team20.pki.certificates.model;

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
@Table(name = "certificate_download_requests")
public class CertificateDownloadRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotEmpty
    @Column(nullable = false)
    private String password;

    @NotNull
    @Column(nullable = false, columnDefinition = "TIMESTAMP")
    private Instant expirationTime;

    @ManyToOne
    private Certificate certificate;
}
