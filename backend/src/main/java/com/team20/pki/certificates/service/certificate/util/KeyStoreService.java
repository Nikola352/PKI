package com.team20.pki.certificates.service.certificate.util;

import com.team20.pki.common.exception.InvalidRequestError;
import com.team20.pki.common.exception.ServerError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

@Slf4j
@Component
public class KeyStoreService {
    private final KeyStore keyStore;

    @Value("${cert-keystore.path}")
    private String certificateFilePath;

    public KeyStoreService() throws KeyStoreException, NoSuchProviderException {

        keyStore = KeyStore.getInstance("JKS", "SUN");
    }

    public void write(String alias, PrivateKey privateKey, char[] password, java.security.cert.Certificate certificate) {
        try {
            keyStore.setKeyEntry(alias, privateKey, password, new Certificate[]{certificate});
        } catch (KeyStoreException e) {
            log.error(e.getMessage());
            throw new InvalidRequestError(e.getMessage());
        }
    }

    public void write(String alias, java.security.cert.Certificate certificate) {
        try {
            keyStore.setCertificateEntry(alias, certificate);
        } catch (KeyStoreException e) {
            log.error(e.getMessage());
            throw new InvalidRequestError(e.getMessage());
        }
    }

    public void loadKeyStore(String fileName, char[] password) {
        try {
            if (fileName != null) {
                keyStore.load(new FileInputStream(certificateFilePath + "/" + fileName + ".jks"), password);
            } else {
                keyStore.load(null, password);
            }
        } catch (CertificateException | IOException | NoSuchAlgorithmException e) {
            throw new InvalidRequestError(e.getMessage());
        }
    }

    public void saveKeyStore(String fileName, char[] password) throws IOException, CertificateException, KeyStoreException, NoSuchAlgorithmException {
        keyStore.store(new FileOutputStream(certificateFilePath + "/" + fileName + ".jks"), password);
    }

    public X509Certificate readCertificate(String keyStoreFile, char[] password, String alias) {
        try (BufferedInputStream in = new BufferedInputStream(new FileInputStream(certificateFilePath + "/" + keyStoreFile + ".jks"))) {
            keyStore.load(in, password);
            return (X509Certificate) keyStore.getCertificate(alias);
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new ServerError("Failed to read certificate", 500);
        }
    }

    public PrivateKey readPrivateKey(String keyStoreFile, String keyStorePass, String alias, String pass) {
        try {
            //kreiramo instancu KeyStore
            KeyStore ks = KeyStore.getInstance("JKS", "SUN");
            //ucitavamo podatke
            BufferedInputStream in = new BufferedInputStream(new FileInputStream(certificateFilePath + "/" + keyStoreFile + ".jks"));
            ks.load(in, keyStorePass.toCharArray());

            if (ks.isKeyEntry(alias)) {
                return (PrivateKey) ks.getKey(alias, pass.toCharArray());
            }
        } catch (KeyStoreException | NoSuchProviderException | NoSuchAlgorithmException | CertificateException |
                 IOException | UnrecoverableKeyException e) {
            log.error(e.getMessage());
            throw new ServerError("Failed to read private key for alias: " + alias, 500);
        }
        return null;
    }

    public void removePrivateKey(String keyStoreFile, char[] keyStorePassword, String alias) {
        try (FileInputStream fis = new FileInputStream(certificateFilePath + "/" + keyStoreFile + ".jks")) {
            keyStore.load(fis, keyStorePassword);

            if (!keyStore.containsAlias(alias)) {
                throw new InvalidRequestError("Alias not found: " + alias);
            }

            Certificate cert = keyStore.getCertificate(alias);
            if (cert == null) {
                throw new InvalidRequestError("No certificate found for alias: " + alias);
            }

            keyStore.deleteEntry(alias);

            keyStore.setCertificateEntry(alias, cert);

            try (FileOutputStream fos = new FileOutputStream(certificateFilePath + "/" + keyStoreFile + ".jks")) {
                keyStore.store(fos, keyStorePassword);
            }
        } catch (IOException | NoSuchAlgorithmException | CertificateException | KeyStoreException e) {
            log.error(e.getMessage());
            throw new ServerError("Failed to remove private key for alias: " + alias, 500);
        }
    }
}
