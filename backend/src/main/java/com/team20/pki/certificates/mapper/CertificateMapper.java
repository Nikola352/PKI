package com.team20.pki.certificates.mapper;

import com.team20.pki.certificates.dto.CertificateResponseDto;
import com.team20.pki.certificates.dto.CertificateStatusDto;
import com.team20.pki.certificates.model.Certificate;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.time.LocalDate;

@Mapper(componentModel = "spring")
public interface CertificateMapper {
    @Mapping(target = "commonName", ignore = true)
    @Mapping(target = "issuerName", ignore = true)
    @Mapping(target = "status", ignore = true)
    CertificateResponseDto toDto(Certificate certificate);

    @AfterMapping
    default void extractNames(Certificate certificate, @MappingTarget CertificateResponseDto dto) {
        dto.setCommonName(certificate.getSubject().getCommonName());
        dto.setIssuerName(certificate.getIssuer().getCommonName());
        // TODO: check if revoked
        if (certificate.getValidTo().isBefore(LocalDate.now())) {
            dto.setStatus(CertificateStatusDto.EXPIRED);
        } else {
            dto.setStatus(CertificateStatusDto.ACTIVE);
        }
    }
}
