package com.team20.pki.revocation.service.impl;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.common.exception.InvalidRequestError;
import com.team20.pki.revocation.dto.CRLResponseDTO;
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
import java.util.List;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class RevocationService implements IRevocationService {
    private final CertificateRevocationListService crlService;
    private final ICertificateRepository certificateRepository;


    @Override
    public CertificateRevocationResponseDTO revokeCertificate(UUID revokingCertificateId, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        Certificate certificate = certificateRepository.findById(revokingCertificateId).
                orElseThrow(()-> new EntityNotFoundException("Certificate not found"));
        certificate.setIsRevoked(true);
        revokeDownwards(certificate);
        certificateRepository.save(certificate);

        Certificate parentCertificate = certificate.getParent();
        if (parentCertificate == null){
            return createSelfSignedCRL(certificate, revokeCertificateRequestDTO);
        }
        CertificateRevocationList crl = crlService.findForCA(parentCertificate.getId());

        if (crl == null){
            crl = crlService.createEmptyCRL(parentCertificate);
        }
        crlService.addRevocationToCRL(parentCertificate, crl, certificate, revokeCertificateRequestDTO);

        return new CertificateRevocationResponseDTO(true);
    }

    @Override
    public CRLResponseDTO getCertificateRevocationList(UUID certifiedAuthorityCertificateId) throws GeneralSecurityException, IOException, OperatorCreationException {
        CertificateRevocationList crl = crlService.findForCA(certifiedAuthorityCertificateId);
        if (crl == null) {
            Certificate cert = certificateRepository.findById(certifiedAuthorityCertificateId).orElseThrow(() -> new InvalidRequestError("Invalid CA certificate id!"));
            crl = crlService.createEmptyCRL(cert);
        }
        return new CRLResponseDTO(crl.getRevocationList());
    }

    private CertificateRevocationResponseDTO createSelfSignedCRL(Certificate rootCertificate, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        CertificateRevocationList crl = crlService.findForCA(rootCertificate.getId());
        if (crl == null){
            crl = crlService.createEmptyCRL(rootCertificate);
        }
        crlService.addRevocationToCRL(rootCertificate, crl, rootCertificate, revokeCertificateRequestDTO);

        return new CertificateRevocationResponseDTO(true);
    }

    private void revokeDownwards(Certificate parentCertificate) throws GeneralSecurityException, IOException, OperatorCreationException {
        List<Certificate> issuedCertificates = certificateRepository.findAllByParent_Id(parentCertificate.getId());
        for (Certificate cert: issuedCertificates){
            cert.setIsRevoked(true);
            certificateRepository.save(cert);
            addCertificateToCRL(parentCertificate, cert);
            revokeDownwards(cert);
        }
    }

    private void addCertificateToCRL(Certificate parentCertificate, Certificate certToRevoke) throws GeneralSecurityException, IOException, OperatorCreationException {
        CertificateRevocationList crl = crlService.findForCA(parentCertificate.getId());

        if (crl == null){
            crl = crlService.createEmptyCRL(parentCertificate);
        }
        crlService.addRevocationToCRL(parentCertificate, crl, certToRevoke, new RevokeCertificateRequestDTO(2));
    }
}
