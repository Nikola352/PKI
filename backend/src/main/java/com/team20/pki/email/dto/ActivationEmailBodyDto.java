package com.team20.pki.email.dto;

import lombok.Value;

@Value
public class ActivationEmailBodyDto {
    String name;
    String activationUrl;
}
