package com.team20.pki.encryption.service.impl;

import com.team20.pki.encryption.service.MasterKeyProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.codec.Hex;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

@Service
public class EnvMasterKeyProvider implements MasterKeyProvider {
    private final String masterKeyHex;

    public EnvMasterKeyProvider(@Value("${secret.master-key}") String masterKeyHex) {
        this.masterKeyHex = masterKeyHex;
    }

    @Override
    public SecretKey loadMasterKey() {
        byte[] keyBytes = Hex.decode(masterKeyHex);
        return new SecretKeySpec(keyBytes, "AES");
    }
}
