package com.team20.pki.authentication.repository;

import com.team20.pki.authentication.model.RegisterRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RegisterRequestRepository extends JpaRepository<RegisterRequest, UUID> {
    Optional<RegisterRequest> findByVerificationCode(String verificationCode);

    @Modifying
    @Query("delete from RegisterRequest where expirationTime < current_timestamp")
    void deleteAllExpired();
}