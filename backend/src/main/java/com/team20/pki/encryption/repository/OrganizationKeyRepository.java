package com.team20.pki.encryption.repository;

import com.team20.pki.encryption.model.OrganizationKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationKeyRepository extends JpaRepository<OrganizationKey, UUID> {
    Optional<OrganizationKey> findByOrganizationName(String organizationName);
}