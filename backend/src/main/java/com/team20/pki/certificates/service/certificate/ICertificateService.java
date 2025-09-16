package com.team20.pki.certificates.service.certificate;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.naming.InvalidNameException;
import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.List;
import java.util.UUID;

public interface ICertificateService {
    CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException;

    CertificateGetResponseDTO getCertificateById(UUID id);

    List<CAResponseDTO> getCertificateAuthorities(UUID subjectId);

    CertificateCaSignResponseDTO generateCaSignedCertificateForUser(UserDetailsImpl userAuth, CaSignSubjectDataDTO dto) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException;

    CertificateCaSignResponseDTO generateCaSignedCertificate(UserDetailsImpl user, CaSignSubjectDataDTO data) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException;

    CertificateDownloadResponseDTO downloadCertificateForUser(UUID id);

    List<CAResponseDTO> getCertificateAuthorities(UserDetailsImpl userDetails);
}