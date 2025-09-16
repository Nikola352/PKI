package com.team20.pki.certificates.service;

import com.team20.pki.encryption.exception.EncryptionError;
import com.team20.pki.encryption.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrivateKeyEncryptionService {
    private final EncryptionService encryptionService;

    public byte[] encryptKey(PrivateKey plain, String organization) {
        return encryptionService.encrypt(plain.getEncoded(), organization);
    }

    public PrivateKey decryptKey(byte[] encrypted, String organization) {
        byte[] decrypted = encryptionService.decrypt(encrypted, organization);
        try {
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decrypted));
        } catch (InvalidKeySpecException | NoSuchAlgorithmException e) {
            // Should never happen
            log.error(e.getMessage());
            throw new EncryptionError();
        }
    }
}
