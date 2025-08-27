package com.team20.pki.certificates.repository;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ICertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findCertificatesByTypeIn(Collection<CertificateType> types);
}
