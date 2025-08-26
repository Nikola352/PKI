package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.certificates.dto.CertificateGetResponseDTO;
import com.team20.pki.certificates.dto.CertificateSelfSignResponseDTO;
import com.team20.pki.certificates.model.*;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.CertificateGenerator;
import com.team20.pki.certificates.service.certificate.CertificateToPEMConverter;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import com.team20.pki.certificates.service.certificate.Ix500NameService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.asn1.x500.X500Name;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigInteger;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService implements ICertificateService {
    private final ICertificateRepository repository;
    private final CertificateGenerator generator;
    private final CertificateToPEMConverter pemConverter;
    private  final Ix500NameService x500NameService;
    public CertificateSelfSignResponseDTO generateSelfSignedCertificate(SubjectData subjectData) throws IOException {

        X500Name name = x500NameService.createX500Name(subjectData);

        Subject dummySubject = new Subject(name);
        Issuer dummyIssuer = new Issuer(name);
        BigInteger serialNumber = BigInteger.valueOf(System.currentTimeMillis());
        X509Certificate cert = generator.generateSelfSignedCertificate(serialNumber);
        String pemFile = pemConverter.convertToPEM(cert);
        Certificate certificate = new Certificate(
                null,
                CertificateType.ROOT,
                cert.getSerialNumber().toString(),
                pemFile,
                LocalDateTime.now(),
                LocalDateTime.of(2040,10,1,10,0),
                null,
                dummyIssuer,
                dummySubject,
                null
        );
        repository.save(certificate);
        return new CertificateSelfSignResponseDTO(certificate.getId());
    }

    @Override
    public CertificateGetResponseDTO getCertificateById(UUID id) {
        Certificate pemContent = repository.findById(id).orElseThrow(()->new EntityNotFoundException("Not Found"));
        return new CertificateGetResponseDTO(pemContent.getPemFile());
    }


}
