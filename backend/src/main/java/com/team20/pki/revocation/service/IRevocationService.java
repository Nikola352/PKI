package com.team20.pki.revocation.service;

import com.team20.pki.certificates.dto.CertificateCaSignResponseDTO;
import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.model.CertificateRevocationResponseDTO;
import org.bouncycastle.operator.OperatorCreationException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.UUID;

public interface IRevocationService {
    CertificateRevocationResponseDTO revokeCertificate(UUID certificateId, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException;
}
