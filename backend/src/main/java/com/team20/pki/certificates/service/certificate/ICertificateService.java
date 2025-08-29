package com.team20.pki.certificates.service.certificate;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import org.springframework.web.bind.annotation.PathVariable;

import java.io.IOException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.List;
import java.util.UUID;

public interface ICertificateService {
    CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException;

    CertificateGetResponseDTO getCertificateById(UUID id);

    List<CAResponseDTO> getCertificateAuthorities();

    CertificateCaSignResponseDTO generateCaSignedCertificate(UserDetailsImpl user, CaSignSubjectDataDTO data) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException;
    CertificateDownloadResponseDTO downloadCertificateUser(UUID id);
}
