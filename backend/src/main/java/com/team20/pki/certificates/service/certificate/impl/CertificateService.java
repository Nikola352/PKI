package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.model.*;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.*;
import com.team20.pki.certificates.service.certificate.util.*;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.asn1.x500.RDN;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x500.style.IETFUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.naming.InvalidNameException;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService implements ICertificateService {
    private final ICertificateRepository repository;
    private final CertificateGenerator generator;
    private final CertificateToPEMConverter pemConverter;
    private final Ix500NameService x500NameService;
    private final IRSAGenerator rsaGenerator;
    private final KeyStoreService keyStoreService;
    private final KeyStorePasswordGenerator keyStorePasswordGenerator;
    private final UserRepository userRepository;
    private final ICertificateFactory certificateFactory;
    private final PasswordStorage passwordStorage;

    @Transactional
    public CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {

        X500Name name = x500NameService.createX500Name(selfSignSubjectDataDTO);

        BigInteger serial = generateSerialNumber();
        KeyPair keyPair = rsaGenerator.generateKeyPair();

        X509Certificate cert = generator.generateSelfSignedCertificate(serial, keyPair);
        String pemFile = pemConverter.convertToPEM(cert);
        LocalDate from = LocalDateTime.parse(selfSignSubjectDataDTO.validFrom()).toLocalDate();
        LocalDate to   = LocalDateTime.parse(selfSignSubjectDataDTO.validTo()).toLocalDate();


        Certificate certificate = certificateFactory.createCertificate(
                CertificateType.ROOT,
                serial.toString(),
                pemFile,
                from,
                to,
                null,
                new Issuer(name),
                new Subject(name),
                null
        );
        persistCertificate(selfSignSubjectDataDTO.o(), keyPair, cert, certificate);
        return new CertificateSelfSignResponseDTO(certificate.getId());
    }

    @Override
    public CertificateGetResponseDTO getCertificateById(UUID id) {
        Certificate pemContent = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Not Found"));
        return new CertificateGetResponseDTO(pemContent.getPemFile());
    }

    @Override
    public List<CAResponseDTO> getCertificateAuthorities() {
        List<Certificate> CAs = repository.findCertificatesByTypeIn(List.of(CertificateType.ROOT, CertificateType.INTERMEDIATE));
        return CAs.stream().map(certificate -> {
            Subject sub = certificate.getSubject();
            X500Name name = sub.toX500Name();
            RDN[] cnRdns = name.getRDNs(BCStyle.CN);
            String commonName = cnRdns.length > 0
                    ? IETFUtils.valueToString(cnRdns[0].getFirst().getValue())
                    : "";
            String caName = commonName + " CA";

            LocalDate today = LocalDate.now();

            long maxValidity = ChronoUnit.DAYS.between(today, certificate.getValidTo());

            return new CAResponseDTO(certificate.getId(), caName, maxValidity, 1, 1);
        }).toList();
    }

    @Override
    public CertificateCaSignResponseDTO generateCaSignedCertificate(UserDetailsImpl userAuth, CaSignSubjectDataDTO data) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException {
        CertificateType certificateType = declareCertificateType(userAuth);
        Certificate caCertificate = repository.findById(data.caId()).orElseThrow(() -> new EntityNotFoundException("CA Not found"));

        Issuer issuer = caCertificate.getIssuer();
        X500Name subjectName = x500NameService.createX500Name(data);
        Subject subject = new Subject(subjectName);

        String issuersOrganization = issuer.getOrganization();

        BigInteger serialNumber = generateSerialNumber();

        LocalDate today = LocalDate.now();
        LocalDate withDays = today.plusDays(data.validityDays());

        KeyPair keyPair = rsaGenerator.generateKeyPair();

        String parentSerialNumber = caCertificate.getSerialNumber();
        String parentKeystorePassword = passwordStorage.loadKeyStorePassword(issuersOrganization, parentSerialNumber);
        String parentPrivateKeyPassword = passwordStorage.loadPrivateKeyPassword(issuersOrganization, parentSerialNumber);
        PrivateKey parentPrivateKey = keyStoreService.readPrivateKey(parentSerialNumber, parentKeystorePassword, parentSerialNumber, parentPrivateKeyPassword);

        X509Certificate cert = generator.generateCertificate(subject, parentPrivateKey, caCertificate, today, withDays, serialNumber.toString());
        String pemFile = pemConverter.convertToPEM(cert);


        if (withDays.isAfter(caCertificate.getValidTo()))
            throw new IllegalArgumentException("Certificate cannot last longer that its parent CA");

        User user = userRepository.findById(data.subjectId()).orElseThrow(EntityNotFoundException::new);

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        Certificate certificate = certificateFactory.createCertificate(certificateType, cert.getSerialNumber().toString(), pemFile, today, withDays, caCertificate, issuer, subject, user);

        persistCertificate(data.o(), keyPair, cert, certificate);
        return new CertificateCaSignResponseDTO(certificate.getId());

    }

    @Override
    public CertificateDownloadResponseDTO downloadCertificateUser(UUID id) {
        Certificate certificate = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Certificate not found"));

        String pem = certificate.getPemFile();

        byte[] pemBytes = pem.getBytes(StandardCharsets.UTF_8);
        String fileName = "certificate-" + certificate.getSerialNumber() + ".pem";
        return new CertificateDownloadResponseDTO(pemBytes, fileName);
    }

    private CertificateType declareCertificateType(UserDetailsImpl userDetails) {
        User.Role role = userDetails.getUserRole();
        return role.equals(User.Role.REGULAR_USER) ? CertificateType.END_ENTITY : CertificateType.INTERMEDIATE;
    }

    private void persistCertificate(String organization, KeyPair keyPair, X509Certificate cert, Certificate certificate) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        String pkPassword = keyStorePasswordGenerator.generatePassword(16);

        passwordStorage.storePrivateKeyPassword(organization, pkPassword, certificate.getSerialNumber());
        passwordStorage.storeKeyStorePassword(organization, keyStorePassword, certificate.getSerialNumber());

        keyStoreService.loadKeyStore(null, keyStorePassword.toCharArray());
        keyStoreService.write(certificate.getSerialNumber(), keyPair.getPrivate(),pkPassword.toCharArray(), cert);
        keyStoreService.saveKeyStore(certificate.getSerialNumber(), keyStorePassword.toCharArray());

        repository.save(certificate);

    }

    private BigInteger generateSerialNumber() {
        return BigInteger.valueOf(System.currentTimeMillis());
    }


}
