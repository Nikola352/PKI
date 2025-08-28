package com.team20.pki.caUsers.dto;

import java.util.List;
import java.util.UUID;

public record CAUserGetAllResponse(
        UUID id,
        String name,
        String email,
        String organization,
        int issuedCertificates,
        int activeCertificates,
        List<Certificate> certificates
) {
    public record Certificate(
            UUID id,
            String serialNumber,
            String issuedDate,
            String expiryDate,
            Status status,
            String type
    ) {
        public enum Status {
            ACTIVE, EXPIRED, REVOKED
        }
    }
}
