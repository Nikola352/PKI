package com.team20.pki.email.dto;

import lombok.Value;

@Value
public class InvitationEmailBodyDto {
    String name;
    String organization;
    String activationUrl;
}
