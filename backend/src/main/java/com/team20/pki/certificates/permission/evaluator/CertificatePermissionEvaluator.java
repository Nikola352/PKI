package com.team20.pki.certificates.permission.evaluator;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import com.team20.pki.certificates.repository.ICertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CertificatePermissionEvaluator {
    private final ICertificateRepository certificateRepository;

    public boolean canDownloadKeyPair(Authentication authentication, UUID certificateId) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return false;
        } else if (!(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return false;
        }
        final UserDetailsImpl user = ((UserDetailsImpl) authentication.getPrincipal());
        if (user == null) return false;

        Certificate certificate = certificateRepository.findById(certificateId).orElse(null);
        if (certificate == null) {
            // Users should get 403 and not 404 if the certificate does not exist
            // to avoid revealing information about entity existence by id
            return false;
        }

        return switch (user.getUserRole()) {
            case REGULAR_USER -> certificate.getOwner().getId().equals(user.getUserId());
            case CA_USER ->
                    isInCaChain(certificate, user.getUserId()) && !certificate.getType().equals(CertificateType.END_ENTITY);
            case ADMINISTRATOR -> !certificate.getType().equals(CertificateType.END_ENTITY);
        };
    }

    private boolean isInCaChain(Certificate certificate, UUID caId) {
        if (certificate.getOwner().getId().equals(caId)) {
            return true;
        }
        if (certificate.getType().equals(CertificateType.ROOT) || certificate.getParent() == null) {
            return false;
        }
        return isInCaChain(certificate.getParent(), caId);
    }
}
