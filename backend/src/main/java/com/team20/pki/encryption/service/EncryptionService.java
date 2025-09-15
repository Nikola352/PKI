package com.team20.pki.encryption.service;

public interface EncryptionService {
    byte[] encrypt(byte[] value, String organization);
    byte[] decrypt(byte[] cipherText, String organization);
}
