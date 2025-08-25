package com.team20.pki.certificates.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private CertificateType type;

    @Column(unique = true, nullable = false)
    private String serialNumber;

    @Lob
    private String pemFile;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validTo;

    @ManyToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    private Certificate parent;
}
