package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.model.*;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.*;
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
import java.security.KeyPair;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
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

    @Transactional
    public CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException {

        X500Name name = x500NameService.createX500Name(selfSignSubjectDataDTO);

        Subject dummySubject = new Subject(name);
        Issuer dummyIssuer = new Issuer(name);
        BigInteger serialNumber = BigInteger.valueOf(System.currentTimeMillis());

        KeyPair keyPair = rsaGenerator.generateKeyPair();
        X509Certificate cert = generator.generateSelfSignedCertificate(serialNumber, keyPair);
        String pemFile = pemConverter.convertToPEM(cert);


        StoredPrivateKey privateKey = new StoredPrivateKey(null, keyPair.getPrivate().getEncoded());

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        KeyStoreInfo ksInfo = new KeyStoreInfo(serialNumber.toString(), keyStorePassword);

        LocalDateTime from = LocalDateTime.parse(selfSignSubjectDataDTO.validFrom());
        LocalDateTime to = LocalDateTime.parse(selfSignSubjectDataDTO.validTo());

        Certificate certificate = new Certificate(
                null,
                CertificateType.ROOT,
                cert.getSerialNumber().toString(),
                pemFile,
                from,
                to,
                null,
                dummyIssuer,
                dummySubject,
                ksInfo
        );
        keyStoreService.loadKeyStore(null, ksInfo.getKeyStorePassword().toCharArray());
        keyStoreService.write(serialNumber.toString(), keyPair.getPrivate(), keyStorePassword.toCharArray(), cert);
        keyStoreService.saveKeyStore(serialNumber.toString(), keyStorePassword.toCharArray());

        repository.save(certificate);
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

            return new CAResponseDTO(certificate.getId(), caName, maxValidity, 1, 20);
        }).toList();
    }

    @Override
    public CertificateCaSignResponseDTO generateCaSignedCertificate(CaSignSubjectDataDTO data) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException {
        Certificate caCertificate = repository.findById(data.caId()).orElseThrow(() -> new EntityNotFoundException("CA Not found"));

        Issuer issuer = caCertificate.getIssuer();

        X500Name subjectName = x500NameService.createX500Name(data);
        Subject subject = new Subject(subjectName);

        BigInteger serialNumber = BigInteger.valueOf(System.currentTimeMillis());

        KeyPair keyPair = rsaGenerator.generateKeyPair();
        X509Certificate cert = generator.generateSelfSignedCertificate(serialNumber, keyPair);
        String pemFile = pemConverter.convertToPEM(cert);

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        KeyStoreInfo ksInfo = new KeyStoreInfo(serialNumber.toString(), keyStorePassword);

        LocalDateTime today = LocalDateTime.now();
        LocalDateTime withDays = today.plusDays(data.validityDays());

        if(withDays.isAfter(caCertificate.getValidTo()))
            throw new  IllegalArgumentException("Certificate cannot last longer that its parent CA");


        Certificate certificate = new Certificate(
                null,
                CertificateType.ROOT,
                cert.getSerialNumber().toString(),
                pemFile,
                today,
                withDays,
                caCertificate,
                issuer,
                subject,
                ksInfo
        );
        keyStoreService.loadKeyStore(null, ksInfo.getKeyStorePassword().toCharArray());
        keyStoreService.write(serialNumber.toString(), keyPair.getPrivate(), keyStorePassword.toCharArray(), cert);
        keyStoreService.saveKeyStore(serialNumber.toString(), keyStorePassword.toCharArray());

        repository.save(certificate);
        return new CertificateCaSignResponseDTO(certificate.getId());

    }


}
