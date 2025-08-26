package com.team20.pki.certificates.service;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.jcajce.JcaPEMWriter;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.StringWriter;
import java.security.Security;
import java.security.cert.X509Certificate;

@Component
public class CertificateToPEMConverter {
    public CertificateToPEMConverter(){
        Security.addProvider(new BouncyCastleProvider());
    }

    public  String convertToPEM(X509Certificate certificate) throws IOException {
        try (StringWriter stringWriter = new StringWriter();
             JcaPEMWriter pemWriter = new JcaPEMWriter(stringWriter)) {
            pemWriter.writeObject(certificate);
            pemWriter.flush();
            return stringWriter.toString();
        }
    }
}
