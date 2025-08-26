package com.team20.pki.certificates.repository;

import com.team20.pki.certificates.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.UUID;

@Repository
public interface ICertificateRepository extends JpaRepository<Certificate, UUID> {
}
