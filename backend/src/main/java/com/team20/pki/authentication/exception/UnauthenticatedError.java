package com.team20.pki.authentication.exception;

public class UnauthenticatedError extends RuntimeException {
    public UnauthenticatedError(String message) {
        super(message);
    }
}
