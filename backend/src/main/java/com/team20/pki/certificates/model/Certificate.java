package com.team20.pki.certificates.model;


import com.team20.pki.common.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "certificates")
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
    private LocalDate validFrom;

    @Column(nullable = false)
    private LocalDate validTo;

    @ManyToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    private Certificate parent;

    @Embedded
    @AttributeOverride(name = "distinguishedName", column = @Column(name = "issuer_dn", nullable = false))
    private Issuer issuer;
    @Embedded
    @AttributeOverride(name = "distinguishedName", column = @Column(name = "subject_dn", nullable = false))
    private Subject subject;

    @Embedded
    private KeyStoreInfo keyStoreInfo;

    @ManyToOne
    private User owner;
}
