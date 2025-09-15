package com.team20.pki.certificates.dto;

import java.util.UUID;

public record CaSignSubjectExternalDataDTO(UUID subjectId, UUID caId, int validityDays) {
}
