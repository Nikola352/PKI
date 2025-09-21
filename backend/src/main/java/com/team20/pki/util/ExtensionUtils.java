package com.team20.pki.util;

import org.bouncycastle.asn1.x509.*;
import org.bouncycastle.cert.CertIOException;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

public class ExtensionUtils {
    public void addCertificateAuthorityBaseExtensions(JcaX509v3CertificateBuilder builder, Integer maxPathLen) throws CertIOException {
        if (maxPathLen != null) {
            builder.addExtension(
                    Extension.basicConstraints,
                    true,
                    new BasicConstraints(maxPathLen)
            );
            return;
        }
        builder.addExtension(
                Extension.basicConstraints,
                true,
                new BasicConstraints(true)
        );

    }
    public void addKeyUsageExtensions(JcaX509v3CertificateBuilder builder, List<String> usages) throws CertIOException {
        if(usages == null || usages.isEmpty())
            return;
        int keyUsageBits = buildKeyUsageBits(usages);
        builder.addExtension(
                Extension.keyUsage,
                true,
                new KeyUsage(keyUsageBits)
        );

    }
    public  void addExtendedKeyUsage(JcaX509v3CertificateBuilder builder, List<String> selectedEKUs) throws CertIOException {
        if(selectedEKUs == null || selectedEKUs.isEmpty())
            return;
        List<KeyPurposeId> ekus = extractEKUs(selectedEKUs);
        if(ekus.isEmpty())return;
        ExtendedKeyUsage extendedKeyUsage = new ExtendedKeyUsage(ekus.toArray(new KeyPurposeId[0]));
        builder.addExtension(
                Extension.extendedKeyUsage,
                false,
                extendedKeyUsage
        );
    }
    public List<KeyPurposeId> extractEKUs( List<String> selectedEKUs) {
        List<KeyPurposeId> ekuList = new ArrayList<>();
        for (String eku : selectedEKUs) {
            switch (eku) {
                case "serverAuth":
                    ekuList.add(KeyPurposeId.id_kp_serverAuth);
                    break;
                case "clientAuth":
                    ekuList.add(KeyPurposeId.id_kp_clientAuth);
                    break;
                case "codeSigning":
                    ekuList.add(KeyPurposeId.id_kp_codeSigning);
                    break;
                case "emailProtection":
                    ekuList.add(KeyPurposeId.id_kp_emailProtection);
                    break;
                case "timeStamping":
                    ekuList.add(KeyPurposeId.id_kp_timeStamping);
                    break;
                // Add more mappings if needed
                default:
                    throw new IllegalArgumentException("Unknown EKU: " + eku);
            }
        }
        return ekuList;
    }

    private int buildKeyUsageBits(List<String> usages) {
        int keyUsageBits = 0;

        for (String usage : usages) {
            switch (usage) {
                case "digitalSignature":
                    keyUsageBits |= KeyUsage.digitalSignature;
                    break;
                case "nonRepudiation":
                    keyUsageBits |= KeyUsage.nonRepudiation;
                    break;
                case "keyEncipherment":
                    keyUsageBits |= KeyUsage.keyEncipherment;
                    break;
                case "dataEncipherment":
                    keyUsageBits |= KeyUsage.dataEncipherment;
                    break;
                case "keyAgreement":
                    keyUsageBits |= KeyUsage.keyAgreement;
                    break;
                case "keyCertSign":
                    keyUsageBits |= KeyUsage.keyCertSign;
                    break;
                case "cRLSign":
                    keyUsageBits |= KeyUsage.cRLSign;
                    break;
                case "encipherOnly":
                    keyUsageBits |= KeyUsage.encipherOnly;
                    break;
                case "decipherOnly":
                    keyUsageBits |= KeyUsage.decipherOnly;
                    break;
                default:
                    throw new IllegalArgumentException("Unknown Key Usage: " + usage);
            }
        }

        return keyUsageBits;
    }

    public List<String> getUsagesFromBits(KeyUsage keyUsage) {
        List<String> keyUsageList = new ArrayList<>();

        if (keyUsage.hasUsages(KeyUsage.digitalSignature)) {
            keyUsageList.add("digitalSignature");
        }
        if (keyUsage.hasUsages(KeyUsage.nonRepudiation)) {
            keyUsageList.add("nonRepudiation");
        }
        if (keyUsage.hasUsages(KeyUsage.keyEncipherment)) {
            keyUsageList.add("keyEncipherment");
        }
        if (keyUsage.hasUsages(KeyUsage.dataEncipherment)) {
            keyUsageList.add("dataEncipherment");
        }
        if (keyUsage.hasUsages(KeyUsage.keyAgreement)) {
            keyUsageList.add("keyAgreement");
        }
        if (keyUsage.hasUsages(KeyUsage.keyCertSign)) {
            keyUsageList.add("keyCertSign");
        }
        if (keyUsage.hasUsages(KeyUsage.cRLSign)) {
            keyUsageList.add("cRLSign");
        }
        if (keyUsage.hasUsages(KeyUsage.encipherOnly)) {
            keyUsageList.add("encipherOnly");
        }
        if (keyUsage.hasUsages(KeyUsage.decipherOnly)) {
            keyUsageList.add("decipherOnly");
        }

        return keyUsageList;
    }


    public List<String> getExtendedUsagesFromBits(ExtendedKeyUsage extendedKeyUsage) {
        List<String> extendedKeyUsageList = new ArrayList<>();

        for (KeyPurposeId kid : extendedKeyUsage.getUsages()) {
            switch (kid.getId()) {
                case "1.3.6.1.5.5.7.3.1":
                    extendedKeyUsageList.add("serverAuth");
                    break;
                case "1.3.6.1.5.5.7.3.2":
                    extendedKeyUsageList.add("clientAuth");
                    break;
                case "1.3.6.1.5.5.7.3.3":
                    extendedKeyUsageList.add("codeSigning");
                    break;
                case "1.3.6.1.5.5.7.3.4":
                    extendedKeyUsageList.add("emailProtection");
                    break;
                case "1.3.6.1.5.5.7.3.8":
                    extendedKeyUsageList.add("timeStamping");
                    break;
                case "1.3.6.1.5.5.7.3.9":
                    extendedKeyUsageList.add("OCSPSigning");
                    break;
                default:
                    extendedKeyUsageList.add("unknown(" + kid.getId() + ")");
            }
        }

        return extendedKeyUsageList;
    }


    public void addEndEntityBaseExtensions(JcaX509v3CertificateBuilder builder) throws CertIOException {
        builder.addExtension(
                Extension.basicConstraints,
                true,
                new BasicConstraints(false)
        );
    }
}
