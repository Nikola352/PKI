package com.team20.pki.certificates.service.certificate.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class KeyStorePasswordGenerator {
    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String DIGIT = "0123456789";
    private static final String SPECIAL_CHARS = "!@#$%^&*()-_+=<>?";

    private static final String PASSWORD_ALLOW = CHAR_LOWER + CHAR_UPPER + DIGIT + SPECIAL_CHARS;
    private static final SecureRandom random = new SecureRandom();

    public  String generatePassword(int length) {
        if (length < 12) {
            throw new IllegalArgumentException("Password length should be at least 12 characters for security.");
        }

        StringBuilder password = new StringBuilder(length);

        // Ensure at least one character from each category
        password.append(CHAR_LOWER.charAt(random.nextInt(CHAR_LOWER.length())));
        password.append(CHAR_UPPER.charAt(random.nextInt(CHAR_UPPER.length())));
        password.append(DIGIT.charAt(random.nextInt(DIGIT.length())));
        password.append(SPECIAL_CHARS.charAt(random.nextInt(SPECIAL_CHARS.length())));

        // Fill remaining length with random chars from all allowed
        for (int i = 4; i < length; i++) {
            password.append(PASSWORD_ALLOW.charAt(random.nextInt(PASSWORD_ALLOW.length())));
        }

        // Shuffle to avoid predictable pattern
        return shuffleString(password.toString());
    }

    private static String shuffleString(String input) {
        char[] a = input.toCharArray();
        for (int i = a.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return new String(a);
    }
}
