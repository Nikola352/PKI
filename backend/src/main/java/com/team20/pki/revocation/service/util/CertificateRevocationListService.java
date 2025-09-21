package com.team20.pki.revocation.service.util;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.service.certificate.util.KeyStoreService;
import com.team20.pki.certificates.service.certificate.util.PasswordStorage;
import com.team20.pki.revocation.dto.RevokeCertificateRequestDTO;
import com.team20.pki.revocation.model.CertificateRevocationList;
import com.team20.pki.revocation.repository.CertificateRevocationListRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.asn1.x509.CRLReason;
import org.bouncycastle.asn1.x509.Extension;
import org.bouncycastle.cert.X509v2CRLBuilder;
import org.bouncycastle.cert.jcajce.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.security.cert.*;
import java.util.Date;
import java.util.UUID;

import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CertificateRevocationListService {
    private final CertificateRevocationListRepository certificateRevocationListRepository;
    private final KeyStoreService keyStoreService;
    private final PasswordStorage passwordStorage;

    public CertificateRevocationList createEmptyCRL(Certificate parentCACertificate) throws IOException, GeneralSecurityException, OperatorCreationException
    {
        X509Certificate x509Cert = loadCertificate(parentCACertificate);
        PrivateKey parentPrivateKey = loadPrivateKey(parentCACertificate);
        X509v2CRLBuilder crlGen = new JcaX509v2CRLBuilder(x509Cert.getSubjectX500Principal(),
                calculateDate(0));


        crlGen.setNextUpdate(calculateDate(24 * 7));


        // add extensions to CRL
        JcaX509ExtensionUtils extUtils = new JcaX509ExtensionUtils();


        crlGen.addExtension(Extension.authorityKeyIdentifier, false,
                extUtils.createAuthorityKeyIdentifier(x509Cert));


        ContentSigner signer = new JcaContentSignerBuilder(x509Cert.getSigAlgName())
                .setProvider("BC").build(parentPrivateKey);


        JcaX509CRLConverter converter = new JcaX509CRLConverter().setProvider("BC");


        X509CRL x509CRL = converter.getCRL(crlGen.build(signer));

        CertificateRevocationList crl = new CertificateRevocationList(null, parentCACertificate, toByteArray(x509CRL));
        return certificateRevocationListRepository.save(crl);
    }

    public CertificateRevocationList addRevocationToCRL(Certificate parentCACertificate, CertificateRevocationList crl, Certificate certToRevoke, RevokeCertificateRequestDTO revokeCertificateRequestDTO) throws IOException, GeneralSecurityException, OperatorCreationException
    {
        X509CRL x509CRL = fromByteArray(crl.getRevocationList());
        X509Certificate x509Cert = loadCertificate(parentCACertificate);
        X509v2CRLBuilder crlGen = new JcaX509v2CRLBuilder(x509CRL);


        crlGen.setNextUpdate(calculateDate(24 * 7));


        // add revocation
        ExtensionsGenerator extGen = new ExtensionsGenerator();


        CRLReason crlReason = CRLReason.lookup(revokeCertificateRequestDTO.reason());


        extGen.addExtension(Extension.reasonCode, false, crlReason);




        crlGen.addCRLEntry(BigInteger.valueOf(Long.parseLong(certToRevoke.getSerialNumber())),
                new Date(), extGen.generate());

        PrivateKey parentPrivateKey = loadPrivateKey(parentCACertificate);

        ContentSigner signer = new JcaContentSignerBuilder(x509Cert.getSigAlgName())
                .setProvider("BC").build(parentPrivateKey);


        JcaX509CRLConverter converter = new JcaX509CRLConverter().setProvider("BC");

        x509CRL = converter.getCRL(crlGen.build(signer));
        crl.setRevocationList(toByteArray(x509CRL));
        return certificateRevocationListRepository.save(crl);
    }

    public CertificateRevocationList findForCA(UUID caCertificateId){
        return certificateRevocationListRepository.findByCACertificateId(caCertificateId);
    }

    private Date calculateDate(int hoursInFuture)
    {
        long secs = System.currentTimeMillis() / 1000;
        return new Date((secs + ((long) hoursInFuture * 60 * 60)) * 1000);
    }

    private byte[] toByteArray(X509CRL crl) throws CRLException {
        return crl.getEncoded();
    }

    public static X509CRL fromByteArray(byte[] data) throws CRLException, CertificateException {
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        return (X509CRL) cf.generateCRL(new ByteArrayInputStream(data));
    }

    private X509Certificate loadCertificate(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        return keyStoreService.readCertificate(serialNumber, keyStorePass.toCharArray(), serialNumber);
    }

    private PrivateKey loadPrivateKey(Certificate certificate) {
        final String organization = certificate.getIssuer().getOrganization();
        final String serialNumber = certificate.getSerialNumber();
        final String keyStorePass = passwordStorage.loadKeyStorePassword(organization, serialNumber);
        final String privateKeyPass = passwordStorage.loadPrivateKeyPassword(organization, serialNumber);
        return keyStoreService.readPrivateKey(serialNumber, keyStorePass, serialNumber, privateKeyPass);
    }

}
