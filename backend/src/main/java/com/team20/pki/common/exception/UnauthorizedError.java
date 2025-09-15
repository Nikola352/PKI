package com.team20.pki.common.exception;

public class UnauthorizedError extends RuntimeException {
    public UnauthorizedError() {
    }

    public UnauthorizedError(String message) {
        super(message);
    }
}
