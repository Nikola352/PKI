package com.team20.pki.encryption.service.impl;

import com.team20.pki.encryption.exception.EncryptionError;
import com.team20.pki.encryption.mapper.OrganizationKeyMapper;
import com.team20.pki.encryption.model.OrganizationKey;
import com.team20.pki.encryption.model.WrappedKey;
import com.team20.pki.encryption.repository.OrganizationKeyRepository;
import com.team20.pki.encryption.service.MasterKeyProvider;
import com.team20.pki.encryption.service.OrganizationKeyProvider;
import com.team20.pki.util.SecureRandomGenerator;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;

/**
 * Stores an organization's symmetric DEK in the database wrapped by the master key.
 * Uses {@link MasterKeyProvider} to load the master key.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DbOrganizationKeyProvider implements OrganizationKeyProvider {
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final MasterKeyProvider masterKeyProvider;
    private final OrganizationKeyRepository organizationKeyRepository;
    private final OrganizationKeyMapper organizationKeyMapper;

    private SecretKey masterKey;

    @PostConstruct
    public void init() {
        masterKey = masterKeyProvider.loadMasterKey();
    }

    public WrappedKey wrapKey(SecretKey rawKey, SecretKey wrapperKey) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            byte[] iv = SecureRandomGenerator.generateBytes(GCM_IV_LENGTH);
            cipher.init(Cipher.WRAP_MODE, wrapperKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] wrapped = cipher.wrap(rawKey);
            return new WrappedKey(wrapped, iv);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException | InvalidAlgorithmParameterException e) {
            // In case of wrong parameters, should never happen
            log.error(e.getMessage());
            throw new EncryptionError();
        } catch (IllegalBlockSizeException | InvalidKeyException e) {
            log.error(e.getMessage());
            throw new EncryptionError("Invalid key");
        }
    }

    public SecretKey unwrapKey(WrappedKey wrappedKey, SecretKey wrapperKey) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.UNWRAP_MODE, wrapperKey, new GCMParameterSpec(GCM_TAG_LENGTH, wrappedKey.getIv()));
            return (SecretKey) cipher.unwrap(wrappedKey.getCipherText(), "AES", Cipher.SECRET_KEY);
        } catch (NoSuchAlgorithmException | NoSuchPaddingException |
                 InvalidAlgorithmParameterException e) {
            // In case of wrong parameters, should never happen
            log.error(e.getMessage());
            throw new EncryptionError();
        } catch (InvalidKeyException e) {
            log.error(e.getMessage());
            throw new EncryptionError("Invalid key");
        }
    }

    private void saveOrganizationKey(String organization, SecretKey key) {
        WrappedKey wrappedKey = wrapKey(key, masterKey);
        OrganizationKey orgKey = organizationKeyMapper.toOrganizationKey(organization, wrappedKey);
        organizationKeyRepository.save(orgKey);
    }

    @Override
    public SecretKey getOrCreateOrganizationKey(String organization) {
        Optional<OrganizationKey> orgKey = organizationKeyRepository.findByOrganizationName(organization);
        if (orgKey.isPresent()) {
            WrappedKey key = orgKey.get().getWrappedKey();
            return unwrapKey(key, masterKey);
        } else {
            byte[] keyBytes = SecureRandomGenerator.generateBytes(32);
            SecretKey key = new SecretKeySpec(keyBytes, "AES");
            saveOrganizationKey(organization, key);
            return key;
        }
    }
}
