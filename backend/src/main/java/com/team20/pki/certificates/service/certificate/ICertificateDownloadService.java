package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.dto.CertificateDownloadRequestResponseDto;
import com.team20.pki.certificates.dto.CertificateDownloadResponseDTO;
import com.team20.pki.certificates.dto.DownloadCheckResponseDto;

import java.util.UUID;

public interface ICertificateDownloadService {
    DownloadCheckResponseDto checkDownloadAvailability(UUID id);

    CertificateDownloadResponseDTO downloadCertificatePem(UUID certificateId);

    CertificateDownloadResponseDTO downloadCertificate(UUID certificateId, UUID requestId, Boolean includeChain);

    CertificateDownloadRequestResponseDto requestCertificateDownload(UUID certificateId);
}
