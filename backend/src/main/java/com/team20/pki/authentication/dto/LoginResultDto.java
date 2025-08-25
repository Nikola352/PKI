package com.team20.pki.authentication.dto;

import jakarta.servlet.http.Cookie;
import lombok.Value;

@Value
public class LoginResultDto {
    LoginResponseDto loginResponseDto;
    Cookie refreshTokenCookie;
}
