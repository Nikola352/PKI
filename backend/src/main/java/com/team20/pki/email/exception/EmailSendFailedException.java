package com.team20.pki.email.exception;

public class EmailSendFailedException extends RuntimeException {
    public EmailSendFailedException() {
    }

    public EmailSendFailedException(String message) {
        super(message);
    }
}
