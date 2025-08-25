package com.team20.pki.config;

import com.team20.pki.config.properties.EmailConfigProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(EmailConfigProperties.class)
public class JavaMailSenderConfig {
}
