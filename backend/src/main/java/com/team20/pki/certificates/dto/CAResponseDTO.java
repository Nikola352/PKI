package com.team20.pki.certificates.dto;

import java.util.UUID;

public record CAResponseDTO(
        UUID id,
        String name,
        long maxValidityDays,
        long minValidityDays,
        long defaultValidityDays
) {
}
