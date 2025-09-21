package com.team20.pki.certificates.dto;

import com.team20.pki.certificates.model.CertificateType;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CertificateResponseDto {
    private UUID id;
    private CertificateType type;
    private String serialNumber;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String commonName;
    private String issuerName;
    private CertificateStatusDto status;
}
