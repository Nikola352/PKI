package com.team20.pki.certificates.service;

import com.team20.pki.certificates.dto.CertificateGetResponseDTO;
import com.team20.pki.certificates.dto.CertificateSelfSignResponseDTO;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import com.team20.pki.certificates.model.Issuer;
import com.team20.pki.certificates.model.Subject;
import com.team20.pki.certificates.repository.ICertificateRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigInteger;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService implements ICertificateService{
    private final ICertificateRepository repository;
    private final CertificateGenerator generator;
    private final CertificateToPEMConverter pemConverter;

    public CertificateSelfSignResponseDTO generateSelfSignedCertificate() throws IOException {
        Subject dummySubject = new Subject("CN=Tester");
        Issuer dummyIssuer = new Issuer("CN=DummyIssuer");
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
