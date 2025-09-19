package com.team20.pki.revocation.model;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.common.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.security.cert.X509CRL;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="certificate_revocation_list")
public class CertificateRevocationList {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CA_id", nullable = false, unique = true)
    private User user;

    @Lob
    @Column(nullable = false)
    private byte[] revocationList;
}
