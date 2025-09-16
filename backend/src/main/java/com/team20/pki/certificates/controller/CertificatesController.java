package com.team20.pki.certificates.controller;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.naming.InvalidNameException;
import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
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

    @PreAuthorize("hasRole('ADMINISTRATOR')")
    @PostMapping("/self-signed")
    ResponseEntity<CertificateSelfSignResponseDTO> generateSelfSigned(@RequestBody SelfSignSubjectDataDTO data) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {
        CertificateSelfSignResponseDTO response = certificateService.generateSelfSignedCertificate(data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ca-issued")
    ResponseEntity<CertificateCaSignResponseDTO> generateCaSigned(@AuthenticationPrincipal UserDetailsImpl user, @RequestBody CaSignSubjectDataDTO data) throws CertificateException, NoSuchAlgorithmException, IOException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificate(user, data);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ca-external-issued")
    ResponseEntity<CertificateCaSignResponseDTO> generateCaSignedExternal(@AuthenticationPrincipal UserDetailsImpl user, @ModelAttribute CaSignSubjectExternalDataDTO data, @RequestParam("csr")MultipartFile csr) throws NoSuchAlgorithmException, InvalidKeySpecException, IOException, InvalidNameException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, CertificateException, KeyStoreException, BadPaddingException, InvalidKeyException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificateExternal(user,data, csr);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/issued-by-ca")
    ResponseEntity<CertificateCaSignResponseDTO> generateIssuedByCa(@AuthenticationPrincipal UserDetailsImpl user, @RequestBody CaSignSubjectDataDTO data) throws CertificateException, NoSuchAlgorithmException, IOException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificateForUser(user, data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    ResponseEntity<CertificateGetResponseDTO> getCertificate(@PathVariable("id") UUID id) {
        CertificateGetResponseDTO response = certificateService.getCertificateById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-cas/{id}")
    ResponseEntity<List<CAResponseDTO>> getCAs(@PathVariable("id") UUID subjectId) {

        List<CAResponseDTO> response = certificateService.getCertificateAuthorities(subjectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/get-cas")
    ResponseEntity<List<CAResponseDTO>> getCAsCaUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<CAResponseDTO> response = certificateService.getCertificateAuthorities(userDetails);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadcertficate(@PathVariable("id") UUID id) {
        CertificateDownloadResponseDTO downloadResponse = certificateService.downloadCertificateForUser(id);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadResponse.fileName() + "\"")
                .contentType(MediaType.valueOf("application/x-pem-file"))
                .body(downloadResponse.certificateBytes());
    }
}
