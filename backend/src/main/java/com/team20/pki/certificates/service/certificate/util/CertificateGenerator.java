package com.team20.pki.certificates.service.certificate.util;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.Subject;
import com.team20.pki.common.exception.ServerError;
import com.team20.pki.common.model.User;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.CertIOException;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.math.BigInteger;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.UUID;

@Component
public class CertificateGenerator {
    public CertificateGenerator() {
        Security.addProvider(new BouncyCastleProvider());
    }

    public X509Certificate generateCertificate(Subject subject, PrivateKey parentPrivateKey, Certificate parent, LocalDate startDate, LocalDate endDate, String serialNumber, PublicKey publicKey) {
        JcaContentSignerBuilder builder = new JcaContentSignerBuilder("SHA256WithRSAEncryption").setProvider("BC");


        try {
            ContentSigner contentSigner = builder.build(parentPrivateKey);

            X500Name issuerName = parent.getSubject().toX500Name();
            X500Name subjectName = subject.toX500Name();

            BigInteger serial = new BigInteger(serialNumber);

            Date notBefore = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date notAfter = Date.from(endDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

            JcaX509v3CertificateBuilder certificateBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serial,
                    notBefore,
                    notAfter,
                    subjectName,
                    publicKey
            );
            // if the parent certificate
            String crlDistPoint = "http://localhost:8080/api/certificates/revoke/crl/" + parent.getId();
            GeneralName generalName = new GeneralName(GeneralName.uniformResourceIdentifier, crlDistPoint);
            CRLDistPoint distributionPoint = new CRLDistPoint(new DistributionPoint[]{
                    new DistributionPoint(new DistributionPointName(new GeneralNames(generalName)), null, null)});


            certificateBuilder.addExtension(Extension.cRLDistributionPoints, false, distributionPoint);

            X509CertificateHolder certificateHolder = certificateBuilder.build(contentSigner);
            JcaX509CertificateConverter converter = new JcaX509CertificateConverter().setProvider("BC");

            return converter.getCertificate(certificateHolder);
        } catch (OperatorCreationException e) {
            throw new RuntimeException(e);
        } catch (CertificateException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public X509Certificate generateSelfSignedCertificate(UUID id, BigInteger serialNumber, KeyPair keyPair, User owner, LocalDate startDate, LocalDate endDate, Subject subject) {

        try {;
            X500Name subjectName = subject.toX500Name();
            X500Name issuerName = subjectName;

            Date notBefore = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date notAfter = Date.from(endDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

            ContentSigner contentSigner = new JcaContentSignerBuilder("SHA256WithRSAEncryption")
                    .setProvider("BC")
                    .build(keyPair.getPrivate());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serialNumber,
                    notBefore,
                    notAfter,
                    subjectName,
                    keyPair.getPublic()
            );

            String crlDistPoint = "http://localhost:8080/api/certificates/revoke/crl/" + id;
            GeneralName generalName = new GeneralName(GeneralName.uniformResourceIdentifier, crlDistPoint);
            CRLDistPoint distributionPoint = new CRLDistPoint(new DistributionPoint[]{
                    new DistributionPoint(new DistributionPointName(new GeneralNames(generalName)), null, null)});

            certBuilder.addExtension(Extension.cRLDistributionPoints, false, distributionPoint);

            X509Certificate certificate = new JcaX509CertificateConverter()
                    .setProvider("BC")
                    .getCertificate(certBuilder.build(contentSigner));

            certificate.verify(keyPair.getPublic());
            return certificate;
        } catch (OperatorCreationException | CertificateException | NoSuchAlgorithmException | SignatureException |
                 InvalidKeyException | NoSuchProviderException | CertIOException e) {
            throw new ServerError("Could not create certificate", 500);
        }

    }


    public static PrivateKey decryptPrivateKey(byte[] encryptedKey, SecretKey encryptionKey) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] iv = new byte[12]; // Initialization vector
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, encryptionKey, spec);
        byte[] decryptedKey = cipher.doFinal(encryptedKey);
        // Convert decrypted bytes back to PrivateKey
        // This depends on the key algorithm used
        return null; // Placeholder
    }

    public static SecretKey generateAESKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(256); // Specify key size (128, 192, or 256 bits)
        return keyGenerator.generateKey();
    }

    public KeyPair generateKeyPair() {
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
            SecureRandom random = SecureRandom.getInstance("SHA1PRNG", "SUN");
            keyGen.initialize(2048, random);
            return keyGen.generateKeyPair();
        } catch (NoSuchAlgorithmException | NoSuchProviderException e) {
            e.printStackTrace();
        }
        return null;
    }
}