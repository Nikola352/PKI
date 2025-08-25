package com.team20.pki.common.exception;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public class InvalidRequestError extends RuntimeException {
    private final Map<String, String> errors;

    public InvalidRequestError(String message) {
        super(message);
        errors = new HashMap<>();
    }

    public InvalidRequestError(Map<String, String> errors) {
        this.errors = errors;
    }

    public InvalidRequestError(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }

    public void addError(String key, String message) {
        errors.put(key, message);
    }
}
