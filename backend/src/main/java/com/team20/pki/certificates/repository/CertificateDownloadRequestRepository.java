package com.team20.pki.certificates.repository;

import com.team20.pki.certificates.model.CertificateDownloadRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface CertificateDownloadRequestRepository extends JpaRepository<CertificateDownloadRequest, UUID> {
    @Modifying
    @Query("delete from CertificateDownloadRequest r where r.expirationTime < current_timestamp")
    void deleteAllExpired();
}