package com.team20.pki.authentication.dto;

import com.team20.pki.authentication.model.RefreshToken;
import lombok.Value;

@Value
public class RefreshTokenVerificationResult {
    boolean isValid;
    RefreshToken refreshToken;

    public static RefreshTokenVerificationResult createValid(RefreshToken refreshToken) {
        return new RefreshTokenVerificationResult(true, refreshToken);
    }

    public static RefreshTokenVerificationResult createInvalid() {
        return new RefreshTokenVerificationResult(false, null);
    }
}
