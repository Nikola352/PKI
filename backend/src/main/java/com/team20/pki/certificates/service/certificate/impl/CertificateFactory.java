package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.certificates.model.*;
import com.team20.pki.certificates.service.certificate.ICertificateFactory;
import com.team20.pki.common.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class CertificateFactory implements ICertificateFactory {


    public Certificate createCertificate(
            CertificateType type, String serial, String pemFile, LocalDate from, LocalDate to,
            Certificate issuerCert, Issuer issuer, Subject subject, KeyStoreInfo ksInfo, User owner
    ) {
        return new Certificate(null, type, serial, pemFile, from, to, issuerCert, issuer, subject, ksInfo, owner);
    }
}
