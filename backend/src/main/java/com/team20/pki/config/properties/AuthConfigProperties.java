package com.team20.pki.config.properties;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "auth")
public class AuthConfigProperties {
    @NotEmpty
    private String secretKey;

    @NotEmpty
    private String hmacSecretKey;

    @NotNull
    @Positive
    private Long accessTokenExpirationTimeMs;

    @NotNull
    @Positive
    private Long refreshTokenExpirationTimeMs;

    @NotNull
    @Positive
    private Long activationCodeExpirationMinutes;
}
