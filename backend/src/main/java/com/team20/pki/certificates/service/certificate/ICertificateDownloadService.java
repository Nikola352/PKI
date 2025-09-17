package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.dto.CertificateDownloadRequestResponseDto;
import com.team20.pki.certificates.dto.CertificateDownloadResponseDTO;

import java.util.UUID;

public interface ICertificateDownloadService {
    CertificateDownloadResponseDTO downloadCertificatePem(UUID certificateId);

    CertificateDownloadResponseDTO downloadCertificate(UUID certificateId, UUID requestId);

    CertificateDownloadRequestResponseDto requestCertificateDownload(UUID certificateId);
}
