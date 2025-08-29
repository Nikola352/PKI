package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.model.*;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.*;
import com.team20.pki.certificates.service.certificate.util.CertificateGenerator;
import com.team20.pki.certificates.service.certificate.util.CertificateToPEMConverter;
import com.team20.pki.certificates.service.certificate.util.KeyStorePasswordGenerator;
import com.team20.pki.certificates.service.certificate.util.KeyStoreService;
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

import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.chrono.ChronoLocalDate;
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

    @Transactional
    public CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException {

        X500Name name = x500NameService.createX500Name(selfSignSubjectDataDTO);

        BigInteger serial = generateSerialNumber();
        KeyPair keyPair = rsaGenerator.generateKeyPair();

        X509Certificate cert = generator.generateSelfSignedCertificate(serial, keyPair);
        String pemFile = pemConverter.convertToPEM(cert);

        LocalDate from = LocalDate.parse(selfSignSubjectDataDTO.validFrom());
        LocalDate to = LocalDate.parse(selfSignSubjectDataDTO.validTo());

        KeyStoreInfo ksInfo = new KeyStoreInfo(serial.toString(), keyStorePasswordGenerator.generatePassword(16));

        Certificate certificate = certificateFactory.createCertificate(
                CertificateType.ROOT,
                serial.toString(),
                pemFile,
                from,
                to,
                null,
                new Issuer(name),
                new Subject(name),
                ksInfo,
                null
        );

        persistCertificate(ksInfo, serial.toString(), keyPair, cert, certificate);
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
    public CertificateCaSignResponseDTO generateCaSignedCertificate(UserDetailsImpl userAuth, CaSignSubjectDataDTO data) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException {

        CertificateType certificateType = declareCertificateType(userAuth);
        Certificate caCertificate = repository.findById(data.caId()).orElseThrow(() -> new EntityNotFoundException("CA Not found"));


        Issuer issuer = caCertificate.getIssuer();
        X500Name subjectName = x500NameService.createX500Name(data);
        Subject subject = new Subject(subjectName);

        BigInteger serialNumber = BigInteger.valueOf(System.currentTimeMillis());

        LocalDate today = LocalDate.now();
        LocalDate withDays = today.plusDays(data.validityDays());

        KeyPair keyPair = rsaGenerator.generateKeyPair();
        KeyStoreInfo parentKeyStore = caCertificate.getKeyStoreInfo();
        PrivateKey parentPrivateKey = keyStoreService.readPrivateKey(parentKeyStore.getKeyStorePath(), parentKeyStore.getKeyStorePassword(), caCertificate.getSerialNumber(), parentKeyStore.getKeyStorePassword());

        X509Certificate cert = generator.generateCertificate(subject, parentPrivateKey, caCertificate, today, withDays, serialNumber.toString());
        String pemFile = pemConverter.convertToPEM(cert);


        if (withDays.isAfter(caCertificate.getValidTo()))
            throw new IllegalArgumentException("Certificate cannot last longer that its parent CA");

        User user = userRepository.findById(data.subjectId()).orElseThrow(EntityNotFoundException::new);

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        KeyStoreInfo ksInfo = new KeyStoreInfo(serialNumber.toString(), keyStorePassword);
        Certificate certificate = certificateFactory.createCertificate(certificateType, cert.getSerialNumber().toString(), pemFile, today, withDays, caCertificate, issuer, subject, ksInfo, user);

        persistCertificate(ksInfo, serialNumber.toString(), keyPair, cert, certificate);
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

    private void persistCertificate(KeyStoreInfo ksInfo, String serialNumber, KeyPair keyPair, X509Certificate cert, Certificate certificate) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException {
        String keyStorePassword = ksInfo.getKeyStorePassword();
        ;
        keyStoreService.loadKeyStore(null, ksInfo.getKeyStorePassword().toCharArray());
        keyStoreService.write(serialNumber, keyPair.getPrivate(), keyStorePassword.toCharArray(), cert);
        keyStoreService.saveKeyStore(serialNumber, keyStorePassword.toCharArray());

        repository.save(certificate);
    }

    private BigInteger generateSerialNumber() {
        return BigInteger.valueOf(System.currentTimeMillis());
    }


}
