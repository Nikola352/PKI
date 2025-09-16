package com.team20.pki.email.dto;

import lombok.Value;

@Value
public class EmailDto {
    String recipientEmail;
    String subject;
    String body;
}
