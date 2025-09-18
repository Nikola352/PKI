package com.team20.pki.certificates.controller;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.service.certificate.ICertificateDownloadService;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final ICertificateDownloadService certificateDownloadService;

    @PreAuthorize("hasRole('ADMINISTRATOR')")
    @PostMapping("/self-signed")
    ResponseEntity<CertificateSelfSignResponseDTO> generateSelfSigned(@RequestBody SelfSignSubjectDataDTO data) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {
        CertificateSelfSignResponseDTO response = certificateService.generateSelfSignedCertificate(data);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/ca-issued")
    ResponseEntity<CertificateCaSignResponseDTO> generateCaSigned(@RequestBody CaSignSubjectDataDTO data) throws CertificateException, NoSuchAlgorithmException, IOException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificate(data);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ROLE_ADMINISTRATOR') or #userId == authentication.principal.userId")
    ResponseEntity<List<CertificateResponseDto>> getUserCertificates(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(certificateService.getUserCertificates(userId));
    }

    @GetMapping("/tree")
    @Secured("ROLE_ADMINISTRATOR")
    ResponseEntity<List<CertificateNodeResponseDto>> getAllCertificates() {
        return ResponseEntity.ok(certificateService.getAllCertificates());
    }

    @GetMapping("/tree/ca/{id}")
    @PreAuthorize("hasRole('ROLE_ADMINISTRATOR') or (hasRole('ROLE_CA') and #userId == authentication.principal.userId)")
    ResponseEntity<List<CertificateNodeResponseDto>> getCaCertificates(@PathVariable("id") UUID userId) {
        return ResponseEntity.ok(certificateService.getCaCertificates(userId));
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

    @GetMapping("/{id}/download/request")
    @PreAuthorize("@certificatePermissionEvaluator.canDownloadKeyPair(authentication, #id)")
    public ResponseEntity<CertificateDownloadRequestResponseDto> requestCertificateDownload(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(certificateDownloadService.requestCertificateDownload(id));
    }

    @GetMapping("/{id}/download/{requestId}")
    @PreAuthorize("@certificatePermissionEvaluator.canDownloadKeyPair(authentication, #certificateId)")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable("id") UUID certificateId, @PathVariable UUID requestId) {
        CertificateDownloadResponseDTO downloadResponse = certificateDownloadService.downloadCertificate(certificateId, requestId);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadResponse.fileName() + "\"")
                .contentType(MediaType.valueOf("application/x-pkcs12"))
                .body(downloadResponse.certificateBytes());
    }

    @GetMapping("/{id}/download/pem")
    public ResponseEntity<byte[]> downloadCertificatePem(@PathVariable("id") UUID id) {
        CertificateDownloadResponseDTO downloadResponse = certificateDownloadService.downloadCertificatePem(id);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadResponse.fileName() + "\"")
                .contentType(MediaType.valueOf("application/x-pem-file"))
                .body(downloadResponse.certificateBytes());
    }
    
    @GetMapping("/check-root/{userId}")
    public ResponseEntity<RootsExistResponse> rootsExist(@PathVariable("userId") UUID id){
        return ResponseEntity.ok(certificateService.rootsExistsForUser(id));
    }

    @Secured("ROLE_USER")
    @PostMapping("/ca-external-issued")
    ResponseEntity<CertificateCaSignResponseDTO> generateCaSignedExternal(@AuthenticationPrincipal UserDetailsImpl user, @ModelAttribute CaSignSubjectExternalDataDTO data, @RequestParam("csr") MultipartFile csr) throws NoSuchAlgorithmException, IOException, InvalidNameException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, CertificateException, KeyStoreException, BadPaddingException, InvalidKeyException {
        CertificateCaSignResponseDTO response = certificateService.generateCaSignedCertificateExternal(user, data, csr);
        return ResponseEntity.ok(response);
    }
}
