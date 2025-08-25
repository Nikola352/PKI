package com.team20.pki.authentication.repository;

import com.team20.pki.authentication.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);

    void deleteAllBySessionId(String sessionId);

    @Modifying
    @Query("""
        delete from RefreshToken rt
        where rt.sessionId in (
            select rt2.sessionId
            from RefreshToken rt2
            group by rt2.sessionId
            having sum(
                case when rt2.revoked = false and rt2.expirationTime > current_timestamp then 1 else 0 end
            ) = 0
        )
        """)
    void deleteAllExpiredAndRevokedSessions();
}