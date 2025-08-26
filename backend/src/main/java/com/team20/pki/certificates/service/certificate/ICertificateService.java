package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.dto.CertificateGetResponseDTO;
import com.team20.pki.certificates.dto.CertificateSelfSignResponseDTO;
import com.team20.pki.certificates.model.SubjectData;

import java.io.IOException;
import java.util.UUID;

public interface ICertificateService {
    CertificateSelfSignResponseDTO generateSelfSignedCertificate(SubjectData subjectData) throws IOException;

    CertificateGetResponseDTO getCertificateById(UUID id);
}
