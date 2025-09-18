package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.certificates.dto.CertificateDownloadRequestResponseDto;
import com.team20.pki.certificates.dto.CertificateDownloadResponseDTO;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateDownloadRequest;
import com.team20.pki.certificates.repository.CertificateDownloadRequestRepository;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.ICertificateDownloadService;
import com.team20.pki.certificates.service.certificate.util.CertificateToPEMConverter;
import com.team20.pki.certificates.service.certificate.util.KeyStorePasswordGenerator;
import com.team20.pki.certificates.service.certificate.util.KeyStoreService;
import com.team20.pki.certificates.service.certificate.util.PasswordStorage;
import com.team20.pki.common.exception.NotFoundError;
import com.team20.pki.common.exception.ServerError;
import com.team20.pki.encryption.service.EncryptionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class Pkcs12CertificateDownloadService implements ICertificateDownloadService {
    private final ICertificateRepository certificateRepository;
    private final PasswordStorage passwordStorage;
    private final KeyStoreService keyStoreService;
    private final KeyStorePasswordGenerator keyStorePasswordGenerator;
    private final CertificateToPEMConverter certificateToPEMConverter;
    private final CertificateDownloadRequestRepository downloadRequestRepository;
    private final EncryptionService encryptionService;

    @Value("${certificate.download.time-window-ms}")
    private Long downloadDurationMs;
    private Duration downloadDuration;

    @PostConstruct
    public void init() {
        downloadDuration = Duration.ofMillis(downloadDurationMs);
    }

    @Override
    public CertificateDownloadResponseDTO downloadCertificatePem(UUID id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new NotFoundError("Certificate not found"));

        X509Certificate cert = loadCertificate(certificate);

        try {
            String pemContent = certificateToPEMConverter.convertToPEM(cert);
            byte[] pemBytes = pemContent.getBytes(StandardCharsets.UTF_8);

            String fileName = "certificate-" + certificate.getSerialNumber() + ".pem";
            return new CertificateDownloadResponseDTO(pemBytes, fileName);
        } catch (IOException e) {
            throw new ServerError("Failed to create PEM file", 500);
        }
    }

    @Override
    public CertificateDownloadRequestResponseDto requestCertificateDownload(UUID certificateId) {
        Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundError("Certificate not found"));

        final String password = keyStorePasswordGenerator.generatePassword(16);
        final byte[] encryptedBytes = encryptionService.encrypt(
                password.getBytes(StandardCharsets.UTF_8),
                certificate.getIssuer().getOrganization()
        );
        final String encryptedPass = Base64.getEncoder().encodeToString(encryptedBytes);

        CertificateDownloadRequest request = CertificateDownloadRequest.builder()
                .password(encryptedPass)
                .expirationTime(Instant.now().plus(downloadDuration))
                .certificate(certificate)
                .build();

        request = downloadRequestRepository.save(request);

        return new CertificateDownloadRequestResponseDto(request.getId(), password);
    }

    @Override
    @Transactional
    public CertificateDownloadResponseDTO downloadCertificate(UUID certificateId, UUID requestId) {
        final Certificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new NotFoundError("Certificate not found"));

        final X509Certificate cert = loadCertificate(certificate);
        final PrivateKey privateKey = loadPrivateKey(certificate);

        final CertificateDownloadRequest downloadRequest = downloadRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundError("Password expired"));

        if (downloadRequest.getExpirationTime().isBefore(Instant.now())) {
            downloadRequestRepository.delete(downloadRequest);
            throw new NotFoundError("Password expired");
        }

        final byte[] encryptedBytes = Base64.getDecoder().decode(downloadRequest.getPassword());
        final byte[] decryptedBytes = encryptionService.decrypt(
                encryptedBytes,
                certificate.getIssuer().getOrganization()
        );
        final String password = new String(decryptedBytes, StandardCharsets.UTF_8);

        downloadRequestRepository.delete(downloadRequest);

        try {
            KeyStore pkcs12 = KeyStore.getInstance("PKCS12");
            pkcs12.load(null, null);

            pkcs12.setKeyEntry(
                    "key",
                    privateKey,
                    password.toCharArray(),
                    new X509Certificate[]{cert}
            );

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            pkcs12.store(baos, password.toCharArray());
            baos.flush();

            byte[] pkcs12Bytes = baos.toByteArray();
            String fileName = "certificate-" + certificate.getSerialNumber() + ".p12";

            return new CertificateDownloadResponseDTO(pkcs12Bytes, fileName);

        } catch (KeyStoreException | IOException | NoSuchAlgorithmException | CertificateException e) {
            log.error(e.getMessage());
            throw new ServerError("Failed to create PKCS12 file", 500);
        }
    }

    private PrivateKey loadPrivateKey(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        final String privateKeyPass = passwordStorage.loadPrivateKeyPassword(organization, serialNumber);
        return keyStoreService.readPrivateKey(serialNumber, keyStorePass, serialNumber, privateKeyPass);
    }

    private X509Certificate loadCertificate(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        return keyStoreService.readCertificate(serialNumber, keyStorePass.toCharArray(), serialNumber);
    }

    @Scheduled(cron = "${certificate.download.delete-cron}")
    public void clearExpiredTokens() {
        downloadRequestRepository.deleteAllExpired();
    }
}
