package com.team20.pki.certificates.service.certificate.util;

import com.team20.pki.encryption.exception.EncryptionError;
import com.team20.pki.encryption.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Component
@RequiredArgsConstructor
public class PasswordStorage {
    private final EncryptionService encryptionService;

    @Value("${pk-password-keystore.path}")
    private String privateKeyFilePath;

    @Value("${ks-password-keystore.path}")
    private String ksPasswordFilePath;

    public void storePrivateKeyPassword(String organization, String pkPassword, String serialNumber) {
        Path fullPath = Paths.get(privateKeyFilePath).resolve(serialNumber + ".key");
        byte[] fileContent = encryptionService.encrypt(pkPassword.getBytes(StandardCharsets.UTF_8), organization);
        try {
            Files.write(fullPath, fileContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store private key", e);
        }
    }

    public void storeKeyStorePassword(String organization, String keyStorePassword, String serialNumber) {
        Path fullPath = Paths.get(ksPasswordFilePath).resolve(serialNumber + ".key");
        byte[] fileContent = encryptionService.encrypt(keyStorePassword.getBytes(StandardCharsets.UTF_8), organization);
        try {
            Files.write(fullPath, fileContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store key store password", e);
        }
    }

    public String loadPrivateKeyPassword(String organization, String serialNumber) {
        try {
            Path fullPath = Paths.get(privateKeyFilePath).resolve(serialNumber + ".key");
            byte[] fileContent = Files.readAllBytes(fullPath);
            byte[] plaintext = encryptionService.decrypt(fileContent, organization);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (EncryptionError | IOException e) {
            throw new RuntimeException("Failed to decrypt password from file for serial: " + serialNumber, e);
        }
    }

    public String loadKeyStorePassword(String organization, String serialNumber) {
        try {
            Path fullPath = Paths.get(ksPasswordFilePath).resolve(serialNumber + ".key");
            byte[] fileContent = Files.readAllBytes(fullPath);
            byte[] plaintext = encryptionService.decrypt(fileContent, organization);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (EncryptionError | IOException e) {
            throw new RuntimeException("Failed to decrypt password from file for serial: " + serialNumber, e);
        }
    }
}
