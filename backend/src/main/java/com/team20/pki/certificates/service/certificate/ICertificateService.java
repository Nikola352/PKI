package com.team20.pki.certificates.service.certificate;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import org.springframework.web.multipart.MultipartFile;

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
    CertificateCaSignResponseDTO generateCaSignedCertificateExternal(UserDetailsImpl user, CaSignSubjectExternalDataDTO data, MultipartFile csr) throws NoSuchAlgorithmException, IOException, InvalidNameException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, CertificateException, KeyStoreException, BadPaddingException, InvalidKeyException;

    CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException;

    CertificateGetResponseDTO getCertificateById(UUID id);

    List<CAResponseDTO> getCertificateAuthorities(UUID subjectId);

    CertificateCaSignResponseDTO generateCaSignedCertificate(CaSignSubjectDataDTO dto) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException;

    CertificateDownloadResponseDTO downloadCertificateForUser(UUID id);

    List<CAResponseDTO> getCertificateAuthorities(UserDetailsImpl userDetails);

    List<CertificateResponseDto> getUserCertificates(UUID userId);

    List<CertificateNodeResponseDto> getAllCertificates();

    List<CertificateNodeResponseDto> getCaCertificates(UUID userId);

    RootsExistResponse rootsExistsForUser(UUID id);
}