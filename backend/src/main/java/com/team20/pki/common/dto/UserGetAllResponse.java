package com.team20.pki.common.dto;

import com.team20.pki.caUsers.dto.CAUserGetAllResponse;

import java.util.List;
import java.util.UUID;

public record UserGetAllResponse(
        UUID id,
        String name,
        String email,
        String organization,
        int activeCertificates,
        List<Certificate> certificates,
        String role
) {
    public record Certificate(
            UUID id,
            String serialNumber,
            String issuedDate,
            String expiryDate,
            CAUserGetAllResponse.Certificate.Status status,
            String type
    ) {
        public enum Status {
            ACTIVE, EXPIRED, REVOKED
        }
    }
}