package com.team20.pki.authentication.dto;

import com.team20.pki.common.model.User;
import lombok.Value;

import java.util.UUID;

@Value
public class LoginResponseDto {
    UUID id;
    String email;
    String fullName;
    User.Role role;
    String accessToken;
}
