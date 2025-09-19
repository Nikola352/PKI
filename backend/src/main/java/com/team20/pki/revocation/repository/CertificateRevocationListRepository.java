package com.team20.pki.revocation.repository;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.revocation.model.CertificateRevocationList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CertificateRevocationListRepository extends JpaRepository<CertificateRevocationList, UUID> {
    Optional<CertificateRevocationList> findByUserId(UUID userId);
}
