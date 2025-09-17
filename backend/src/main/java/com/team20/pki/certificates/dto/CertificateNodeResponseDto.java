package com.team20.pki.certificates.dto;

import lombok.Value;

import java.util.List;

@Value
public class CertificateNodeResponseDto {
    CertificateResponseDto certificate;
    List<CertificateNodeResponseDto> children;
}
