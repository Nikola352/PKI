package com.team20.pki.config.properties;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "email.config")
public class EmailConfigProperties {
    @Email
    @NotBlank
    private String fromEmail;

    @NotBlank
    private String fromName;
}
