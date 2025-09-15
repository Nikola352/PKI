package com.team20.pki.encryption.exception;

public class EncryptionError extends RuntimeException {
    public EncryptionError() {
    }

    public EncryptionError(String message) {
        super(message);
    }
}
