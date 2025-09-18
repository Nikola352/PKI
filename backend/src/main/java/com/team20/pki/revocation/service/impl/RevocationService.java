package com.team20.pki.revocation.service.impl;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.impl.CertificateService;
import com.team20.pki.certificates.service.certificate.util.KeyStoreService;
import com.team20.pki.certificates.service.certificate.util.PasswordStorage;
import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.model.CertificateRevocationList;
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
    public boolean revokeCertificate(UUID revokingCertificateId, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        Certificate certificate = certificateRepository.findById(revokingCertificateId).
                orElseThrow(()-> new EntityNotFoundException("Certificate not found"));
        certificate.setIsRevoked(true);
        certificateRepository.save(certificate);

        Certificate parentCertificate = certificate.getParent();
        CertificateRevocationList crl = crlService.findForCertificateId(parentCertificate.getId());
        PrivateKey parentPrivateKey = loadPrivateKey(parentCertificate);
        if (crl == null){
            crl = crlService.createEmptyCRL(parentPrivateKey, parentCertificate);
        }
        crlService.addRevocationToCRL(parentPrivateKey, crl, certificate, revokeCertificateRequestDTO);

        return true;
    }

    private PrivateKey loadPrivateKey(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        final String privateKeyPass = passwordStorage.loadPrivateKeyPassword(organization, serialNumber);
        return keyStoreService.readPrivateKey(serialNumber, keyStorePass, serialNumber, privateKeyPass);
    }
}
