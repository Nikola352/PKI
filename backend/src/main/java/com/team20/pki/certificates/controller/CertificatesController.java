package com.team20.pki.certificates.controller;

import com.team20.pki.certificates.dto.CertificateGetResponseDTO;
import com.team20.pki.certificates.dto.CertificateSelfSignResponseDTO;
import com.team20.pki.certificates.model.SubjectData;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping(value = "/api/certificates")
@RequiredArgsConstructor
public class CertificatesController {
    private final ICertificateService certificateService;

    @PostMapping("/self-signed")
    ResponseEntity<?> generateSelfSigned(@RequestBody SubjectData data) throws IOException {
       CertificateSelfSignResponseDTO response=  certificateService.generateSelfSignedCertificate(data);
        return ResponseEntity.ok(response.certificateId.toString());
    }
    @GetMapping( "/{id}")
    ResponseEntity<CertificateGetResponseDTO> getCertificate(@PathVariable("id") UUID id){
        CertificateGetResponseDTO response = certificateService.getCertificateById(id);
        return  ResponseEntity.ok(response);
    }
}
