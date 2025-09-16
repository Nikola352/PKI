package com.team20.pki.encryption.service;

import com.team20.pki.encryption.exception.EncryptionError;

public interface EncryptionService {
    byte[] encrypt(byte[] value, String organization) throws EncryptionError;
    byte[] decrypt(byte[] cipherText, String organization) throws EncryptionError;
}