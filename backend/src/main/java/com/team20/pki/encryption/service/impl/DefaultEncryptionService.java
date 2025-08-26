package com.team20.pki.encryption.service.impl;

import com.team20.pki.encryption.exception.EncryptionError;
import com.team20.pki.encryption.service.EncryptionService;
import com.team20.pki.encryption.service.OrganizationKeyProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
@RequiredArgsConstructor
public class DefaultEncryptionService implements EncryptionService {
    private static final int GCM_TAG_LENGTH = 128; // bits
    private static final int GCM_IV_LENGTH = 12;   // bytes
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    private final OrganizationKeyProvider organizationKeyProvider;

    @Override
    public byte[] encrypt(byte[] value, String organization) {
        SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);

        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, orgKey);

            byte[] iv = cipher.getIV();
            byte[] cipherText = cipher.doFinal(value);

            byte[] encrypted = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encrypted, 0, iv.length);
            System.arraycopy(cipherText, 0, encrypted, iv.length, cipherText.length);

            return encrypted;
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException |
                 IllegalBlockSizeException | BadPaddingException e) {
            log.error("Encryption failed", e);
            throw new EncryptionError();
        }
    }

    @Override
    public byte[] decrypt(byte[] encrypted, String organization) {
        SecretKey orgKey = organizationKeyProvider.getOrCreateOrganizationKey(organization);

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] cipherText = new byte[encrypted.length - GCM_IV_LENGTH];
            System.arraycopy(encrypted, 0, iv, 0, iv.length);
            System.arraycopy(encrypted, iv.length, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, orgKey, gcmSpec);

            return cipher.doFinal(cipherText);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidKeyException |
                 IllegalBlockSizeException | BadPaddingException | InvalidAlgorithmParameterException e) {
            log.error("Decryption failed", e);
            throw new EncryptionError();
        }
    }
}
