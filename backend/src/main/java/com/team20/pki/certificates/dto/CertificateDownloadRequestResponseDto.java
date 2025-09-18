package com.team20.pki.certificates.dto;

import lombok.Value;

import java.util.UUID;

@Value
public class CertificateDownloadRequestResponseDto {
    UUID id;
    String password;
}
