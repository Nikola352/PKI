package com.team20.pki.revocation.controller;


import com.team20.pki.certificates.dto.CertificateCaSignResponseDTO;
import com.team20.pki.revocation.dto.CRLResponseDTO;
import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.model.CertificateRevocationResponseDTO;
import com.team20.pki.revocation.service.IRevocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.operator.OperatorCreationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates/revoke")
@RequiredArgsConstructor
public class RevocationController {
    private final IRevocationService revocationService;

    @PutMapping("/{certificateId}")
    ResponseEntity<CertificateRevocationResponseDTO> revokeCertificate(@PathVariable("certificateId") UUID certificateId, @Valid @RequestBody RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        CertificateRevocationResponseDTO response = revocationService.revokeCertificate(certificateId, revokeCertificateRequestDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/crl/{serialNumber}")
    ResponseEntity<byte[]> getCertificateRevocationList(@PathVariable("serialNumber")UUID certifiedAuthorityCertificateId) throws GeneralSecurityException, IOException, OperatorCreationException {
        CRLResponseDTO response = revocationService.getCertificateRevocationList(certifiedAuthorityCertificateId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"crl.der\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pkix-crl")
                .body(response.revocationList());
    }

}
