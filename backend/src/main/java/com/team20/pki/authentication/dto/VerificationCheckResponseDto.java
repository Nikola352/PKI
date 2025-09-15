package com.team20.pki.authentication.dto;

import lombok.Value;

@Value
public class VerificationCheckResponseDto {
    String email;
    String fullName;
    String organization;
}
