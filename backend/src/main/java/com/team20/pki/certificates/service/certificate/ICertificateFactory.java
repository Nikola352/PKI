package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import com.team20.pki.certificates.model.Issuer;
import com.team20.pki.certificates.model.Subject;
import com.team20.pki.common.model.User;

import java.time.LocalDate;

public interface ICertificateFactory {
     Certificate createCertificate(
             CertificateType type, String serial, LocalDate from, LocalDate to,
             Certificate issuerCert, Issuer issuer, Subject subject, User owner);
}
