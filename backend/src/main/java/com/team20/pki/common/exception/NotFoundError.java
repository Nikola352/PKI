package com.team20.pki.common.exception;

public class NotFoundError extends RuntimeException {
    public NotFoundError() {
    }

    public NotFoundError(String message) {
        super(message);
    }
}
