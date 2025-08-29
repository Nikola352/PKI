package com.team20.pki.certificates.controller;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/certificates")
@RequiredArgsConstructor
public class CertificatesController {
    private final ICertificateService certificateService;

    @PostMapping("/self-signed")
    ResponseEntity<CertificateSelfSignResponseDTO> generateSelfSigned(@RequestBody SelfSignSubjectDataDTO data) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException {
        CertificateSelfSignResponseDTO response = certificateService.generateSelfSignedCertificate(data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ca-issued")
    ResponseEntity<CertificateCaSignResponseDTO> generateCaSigned(@AuthenticationPrincipal UserDetailsImpl user, @RequestBody CaSignSubjectDataDTO data) throws CertificateException, NoSuchAlgorithmException, IOException, KeyStoreException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificate(user,data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    ResponseEntity<CertificateGetResponseDTO> getCertificate(@PathVariable("id") UUID id) {
        CertificateGetResponseDTO response = certificateService.getCertificateById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-cas")
    ResponseEntity<List<CAResponseDTO>> getCAs() {

        List<CAResponseDTO> response = certificateService.getCertificateAuthorities();
        return ResponseEntity.ok(response);
    }
}
