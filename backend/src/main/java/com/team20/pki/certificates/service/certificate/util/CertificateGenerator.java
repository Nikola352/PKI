package com.team20.pki.certificates.service.certificate.util;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import com.team20.pki.certificates.model.Subject;
import com.team20.pki.common.exception.ServerError;
import com.team20.pki.common.model.User;
import com.team20.pki.util.ExtensionUtils;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.CertIOException;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509ExtensionUtils;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.UUID;

@Component
public class CertificateGenerator {
    private final ExtensionUtils extensionUtils;

    public CertificateGenerator() {
        Security.addProvider(new BouncyCastleProvider());
        extensionUtils = new ExtensionUtils();
    }

    public X509Certificate generateCertificate(
            Subject subject,
            PrivateKey parentPrivateKey,
            PublicKey parentPublicKey,
            Certificate parent,
            LocalDate startDate,
            LocalDate endDate,
            String serialNumber,
            PublicKey publicKey,
            CertificateType type,
            Integer maxLength,
            List<String> keyUsage,
            List<String> extendedKeyUsage) {
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
            SubjectKeyIdentifier ski = new JcaX509ExtensionUtils().createSubjectKeyIdentifier(publicKey);
            certificateBuilder.addExtension(Extension.subjectKeyIdentifier, false, ski);

            AuthorityKeyIdentifier aki = new JcaX509ExtensionUtils().createAuthorityKeyIdentifier(parentPublicKey);
            certificateBuilder.addExtension(Extension.authorityKeyIdentifier, false, aki);

            if (type.equals(CertificateType.END_ENTITY)) {
                extensionUtils.addEndEntityBaseExtensions(certificateBuilder);
            } else {
                extensionUtils.addCertificateAuthorityBaseExtensions(certificateBuilder, maxLength);
            }

            GeneralName[] sanNames = new GeneralName[] {
                    new GeneralName(GeneralName.dNSName, "localhost"),
                    new GeneralName(GeneralName.iPAddress, "127.0.0.1"),
                    new GeneralName(GeneralName.iPAddress, "::1")
            };
            certificateBuilder.addExtension(Extension.subjectAlternativeName, false, new GeneralNames(sanNames));

            List<String> updatedKeyUsage = concatenateBaseCaKeyUsage(type, keyUsage);
            extensionUtils.addKeyUsageExtensions(certificateBuilder, updatedKeyUsage);
            extensionUtils.addExtendedKeyUsage(certificateBuilder, extendedKeyUsage);
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
    private List<String> concatenateBaseCaKeyUsage(CertificateType type, List<String> keyUsage) {
        List<String> updatedKeyUsage = keyUsage.stream().toList();
        if (!type.equals(CertificateType.END_ENTITY))
            updatedKeyUsage = Stream.concat(updatedKeyUsage.stream(), Stream.of("keyCertSign", "cRLSign")).distinct().toList();
        return updatedKeyUsage;
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

            extensionUtils.addCertificateAuthorityBaseExtensions(certBuilder, null);
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
}