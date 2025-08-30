package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.model.*;
import com.team20.pki.common.model.User;

import java.time.LocalDate;

public interface ICertificateFactory {
     Certificate createCertificate(
             CertificateType type, String serial, String pemFile, LocalDate from, LocalDate to,
             Certificate issuerCert, Issuer issuer, Subject subject, User owner);
}
