package com.team20.pki.common.dto;

import java.util.UUID;

public record UserCertificateIssueResponseDTO(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String organization,
        String role) {
}
