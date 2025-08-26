package com.team20.pki.certificates.service;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.Subject;
import org.bouncycastle.asn1.x500.X500Name;
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

@Component
public class CertificateGenerator {
    public CertificateGenerator() {
        Security.addProvider(new BouncyCastleProvider());
    }

    public X509Certificate generateCertificate(Subject subject, Certificate parent, LocalDate startDate, LocalDate endDate, String serialNumber) {
        JcaContentSignerBuilder builder = new JcaContentSignerBuilder("SHA256WithRSAEncryption").setProvider("BC");

        SecretKey temporary = null;
        try {
            temporary = generateAESKey();

            PrivateKey decryptedPrivateKey = decryptPrivateKey(parent.getPrivateKey().getKey(), temporary);
            ContentSigner contentSigner = builder.build(decryptedPrivateKey);

            X500Name issuerName = parent.getIssuer().toX500Name();
            X500Name subjectName = parent.getSubject().toX500Name();

            BigInteger serial = new BigInteger(serialNumber);

            Date notBefore = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date notAfter = Date.from(endDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

            JcaX509v3CertificateBuilder certificateBuilder = new JcaX509v3CertificateBuilder(
                    issuerName,
                    serial,
                    notBefore,
                    notAfter,
                    subjectName,
                    generateKeyPair().getPublic()
            );

            X509CertificateHolder certificateHolder = certificateBuilder.build(contentSigner);
            JcaX509CertificateConverter converter = new JcaX509CertificateConverter().setProvider("BC");

            return converter.getCertificate(certificateHolder);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        } catch (OperatorCreationException e) {
            throw new RuntimeException(e);
        } catch (CertificateException e) {
            throw new RuntimeException(e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public X509Certificate generateSelfSignedCertificate(BigInteger serialNumber) {

        try {
            KeyPair keyPair = generateKeyPair();
            X500Name issuer = new X500Name("CN=Root Certificate");
            X500Name subject = issuer; // Self-signed, so subject and issuer are the same

            Date notBefore = new Date(System.currentTimeMillis() - 24 * 60 * 60 * 1000); // yesterday
            Date notAfter = new Date(System.currentTimeMillis() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

            ContentSigner contentSigner = null;
            contentSigner = new JcaContentSignerBuilder("SHA256WithRSAEncryption")
                    .setProvider("BC")
                    .build(keyPair.getPrivate());

            JcaX509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                    issuer,
                    serialNumber,
                    notBefore,
                    notAfter,
                    subject,
                    keyPair.getPublic()
            );

            X509Certificate certificate = new JcaX509CertificateConverter()
                    .setProvider("BC")
                    .getCertificate(certBuilder.build(contentSigner));

            certificate.verify(keyPair.getPublic());
            return certificate;
        } catch (OperatorCreationException e) {
            throw new RuntimeException(e);
        } catch (CertificateException e) {
            throw new RuntimeException(e);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        } catch (SignatureException e) {
            throw new RuntimeException(e);
        } catch (InvalidKeyException e) {
            throw new RuntimeException(e);
        } catch (NoSuchProviderException e) {
            throw new RuntimeException(e);
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