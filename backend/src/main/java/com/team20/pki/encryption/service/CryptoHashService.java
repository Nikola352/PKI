package com.team20.pki.encryption.service;

import com.team20.pki.config.properties.AuthConfigProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.binary.Hex;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class CryptoHashService {
    private final AuthConfigProperties authConfig;
    private SecretKey hmacKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Base64.getDecoder().decode(authConfig.getHmacSecretKey());
        hmacKey = new SecretKeySpec(keyBytes, "HmacSHA256");
    }

    public String hash(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(hmacKey);
            byte[] hashBytes = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Hex.encodeHexString(hashBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalArgumentException("Invalid key");
        }
    }
}
