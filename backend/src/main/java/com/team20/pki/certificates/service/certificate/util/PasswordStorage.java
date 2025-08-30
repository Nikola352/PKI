package com.team20.pki.certificates.service.certificate.util;

import com.team20.pki.encryption.model.WrappedKey;
import com.team20.pki.encryption.service.OrganizationKeyProvider;
import com.team20.pki.util.SecureRandomGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Component
@RequiredArgsConstructor
public class PasswordStorage {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private final OrganizationKeyProvider organizationKeyProvider;
    private SecureRandomGenerator secureRandom;

    @Value("${pk-password-keystore.path}")
    private String privateKeyFilePath;

    @Value("${ks-password-keystore.path}")
    private String ksPasswordFilePath;

    public WrappedKey storePrivateKeyPassword(String organization, String pkPassword,String serialNumber) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException, IOException {
        SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);
        byte[] iv = SecureRandomGenerator.generateBytes(GCM_IV_LENGTH);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, orgKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] cipherText = cipher.doFinal(pkPassword.getBytes(StandardCharsets.UTF_8));

        Path fullPath = Paths.get(privateKeyFilePath).resolve(serialNumber+".key");
        String fileContent = Base64.getEncoder().encodeToString(iv)+":"+
                Base64.getEncoder().encodeToString(cipherText);
        Files.writeString(fullPath, fileContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return new WrappedKey(cipherText, iv);
    }
    public WrappedKey storeKeyStorePassword(String organization, String keyStorePassword,String serialNumber) throws NoSuchPaddingException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException, IOException {
        SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);
        byte[] iv = SecureRandomGenerator.generateBytes(GCM_IV_LENGTH);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, orgKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] cipherText = cipher.doFinal(keyStorePassword.getBytes(StandardCharsets.UTF_8));

        Path fullPath = Paths.get(ksPasswordFilePath).resolve(serialNumber+".key");
        String fileContent = Base64.getEncoder().encodeToString(iv)+":"+
                Base64.getEncoder().encodeToString(cipherText);
        Files.writeString(fullPath, fileContent, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return new WrappedKey(cipherText, iv);
    }
    public String loadKeyStorePassword(String organization, String serialNumber) {
        try {
            // Determine the file path
            Path fullPath = Paths.get(ksPasswordFilePath).resolve(serialNumber + ".key");

            // Read the file contents: "Base64(iv):Base64(cipherText)"
            String fileContent = Files.readString(fullPath);
            String[] parts = fileContent.split(":");
            if (parts.length != 2) {
                throw new IllegalStateException("Invalid password file format for serial: " + serialNumber);
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] cipherText = Base64.getDecoder().decode(parts[1]);

            // Decrypt using organization key
            SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, orgKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plaintext = cipher.doFinal(cipherText);

            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt password from file for serial: " + serialNumber, e);
        }}
    public String loadPrivateKeyPassword(String organization, String serialNumber) {
        try {
            Path fullPath = Paths.get(privateKeyFilePath).resolve(serialNumber + ".key");

            // Read the file contents: "Base64(iv):Base64(cipherText)"
            String fileContent = Files.readString(fullPath);
            String[] parts = fileContent.split(":");
            if (parts.length != 2) {
                throw new IllegalStateException("Invalid password file format for serial: " + serialNumber);
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] cipherText = Base64.getDecoder().decode(parts[1]);

            // Decrypt using organization key
            SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, orgKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plaintext = cipher.doFinal(cipherText);

            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt password from file for serial: " + serialNumber, e);
        }
    }

}
