package com.team20.pki.certificates.service;

import com.team20.pki.certificates.dto.CertificateGetResponseDTO;
import com.team20.pki.certificates.dto.CertificateSelfSignResponseDTO;

import java.io.IOException;
import java.util.UUID;

public interface ICertificateService {
    CertificateSelfSignResponseDTO generateSelfSignedCertificate() throws IOException;

    CertificateGetResponseDTO getCertificateById(UUID id);
}
