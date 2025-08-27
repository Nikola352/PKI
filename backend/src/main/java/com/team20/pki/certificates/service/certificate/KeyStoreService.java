package com.team20.pki.certificates.service.certificate;

import org.springframework.stereotype.Component;

import java.io.*;
import java.security.*;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;

@Component
public class KeyStoreService {
    private KeyStore keyStore;
    private final String filePath = "src/main/resources/key-store/";

    public KeyStoreService() throws KeyStoreException, NoSuchProviderException {
        keyStore = KeyStore.getInstance("JKS", "SUN");
    }
    public void write(String alias, PrivateKey privateKey, char[] password, java.security.cert.Certificate certificate) {
        try {
            keyStore.setKeyEntry(alias, privateKey, password, new Certificate[] {certificate});
        } catch (KeyStoreException e) {
            e.printStackTrace();
        }
    }
    public void loadKeyStore(String fileName, char[] password) {
        try {
            if (fileName != null) {
                keyStore.load(new FileInputStream(filePath + fileName + ".jks"), password);
            } else {
                keyStore.load(null, password);
            }
        } catch (FileNotFoundException e) {
            throw new RuntimeException(e);
        } catch (CertificateException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public void saveKeyStore(String fileName, char[] password) throws IOException, CertificateException, KeyStoreException, NoSuchAlgorithmException {
        keyStore.store(new FileOutputStream(filePath + fileName + ".jks"), password);
    }

    public Certificate readCertificate(String keyStoreFile, char[] password, String alias) {
        try (BufferedInputStream in = new BufferedInputStream(new FileInputStream(keyStoreFile))) {
            keyStore.load(in, password);
            return keyStore.getCertificate(alias);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read certificate", e);
        }
    }

    public PrivateKey readPrivateKey(String keyStoreFile, String keyStorePass, String alias, String pass) {
        try {
            //kreiramo instancu KeyStore
            KeyStore ks = KeyStore.getInstance("JKS", "SUN");
            //ucitavamo podatke
            BufferedInputStream in = new BufferedInputStream(new FileInputStream(filePath + keyStoreFile + ".jks"));
            ks.load(in, keyStorePass.toCharArray());

            if (ks.isKeyEntry(alias)) {
                PrivateKey pk = (PrivateKey) ks.getKey(alias, pass.toCharArray());
                return pk;
            }
        } catch (KeyStoreException e) {
            e.printStackTrace();
        } catch (NoSuchProviderException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (CertificateException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (UnrecoverableKeyException e) {
            e.printStackTrace();
        }
        return null;
    }
}
