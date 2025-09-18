package com.team20.pki.revocation.controller;


import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.service.IRevocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.operator.OperatorCreationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificates/revoke")
@RequiredArgsConstructor
public class RevocationController {
    private final IRevocationService revocationService;

    @PutMapping("/{certificateId}")
    ResponseEntity<Boolean> revokeCertificate(@PathVariable("certificateId") UUID certificateId, @Valid @RequestBody RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws GeneralSecurityException, IOException, OperatorCreationException {
        Boolean response = revocationService.revokeCertificate(certificateId, revokeCertificateRequestDTO);
        return ResponseEntity.ok(response);
    }
}
