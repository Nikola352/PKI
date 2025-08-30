package com.team20.pki.certificates.dto;

import java.util.UUID;

public record CaSignSubjectDataDTO(UUID caId, UUID subjectId, String cn, String o, String ou, String c, String st,
                                   String l, String street,
                                   Integer validityDays,
                                   String emailAddress, String serialNumber, String title, String givenName,
                                   String surname,
                                   String initials, String pseudonym, String generationQualifier) {
}