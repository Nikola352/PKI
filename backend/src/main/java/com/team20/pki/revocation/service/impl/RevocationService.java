package com.team20.pki.revocation.service.impl;

import com.team20.pki.certificates.dto.CertificateCaSignResponseDTO;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.impl.CertificateService;
import com.team20.pki.certificates.service.certificate.util.KeyStoreService;
import com.team20.pki.certificates.service.certificate.util.PasswordStorage;
import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.model.CertificateRevocationList;
import com.team20.pki.revocation.model.CertificateRevocationResponseDTO;
import com.team20.pki.revocation.service.IRevocationService;
import com.team20.pki.revocation.service.util.CertificateRevocationListService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.operator.OperatorCreationException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.util.List;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class RevocationService implements IRevocationService {
    private final CertificateRevocationListService crlService;
    private final ICertificateRepository certificateRepository;
    private final PasswordStorage passwordStorage;
    private final KeyStoreService keyStoreService;


    @Override
    public CertificateRevocationResponseDTO revokeCertificate(UUID revokingCertificateId, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        Certificate certificate = certificateRepository.findById(revokingCertificateId).
                orElseThrow(()-> new EntityNotFoundException("Certificate not found"));
        certificate.setIsRevoked(true);
        revokeDownwards(certificate.getId());
        certificateRepository.save(certificate);

        Certificate parentCertificate = certificate.getParent();
        if (parentCertificate == null){
            return createSelfSignedCRL(certificate, revokeCertificateRequestDTO);
        }
        CertificateRevocationList crl = crlService.findForCertificateId(parentCertificate.getId());
        PrivateKey parentPrivateKey = loadPrivateKey(parentCertificate);
        if (crl == null){
            crl = crlService.createEmptyCRL(parentPrivateKey, parentCertificate);
        }
        crlService.addRevocationToCRL(parentPrivateKey, crl, certificate, revokeCertificateRequestDTO);

        return new CertificateRevocationResponseDTO(true);
    }

    private CertificateRevocationResponseDTO createSelfSignedCRL(Certificate rootCertificate, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        CertificateRevocationList crl = crlService.findForCertificateId(rootCertificate.getId());
        PrivateKey rootPrivateKey = loadPrivateKey(rootCertificate);
        if (crl == null){
            crl = crlService.createEmptyCRL(rootPrivateKey, rootCertificate);
        }
        crlService.addRevocationToCRL(rootPrivateKey, crl, rootCertificate, revokeCertificateRequestDTO);

        return new CertificateRevocationResponseDTO(true);
    }

    private void revokeDownwards(UUID certificateId){
        List<Certificate> issuedCertificates = certificateRepository.findAllByParent_Id(certificateId);
        for (Certificate cert: issuedCertificates){
            cert.setIsRevoked(true);
            certificateRepository.save(cert);
            revokeDownwards(cert.getId());
        }
    }

    private PrivateKey loadPrivateKey(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        final String privateKeyPass = passwordStorage.loadPrivateKeyPassword(organization, serialNumber);
        return keyStoreService.readPrivateKey(serialNumber, keyStorePass, serialNumber, privateKeyPass);
    }
}
