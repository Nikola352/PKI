package com.team20.pki.email.service;

import com.team20.pki.email.dto.EmailDto;
import com.team20.pki.email.exception.EmailSendFailedException;

public interface EmailSenderService {
    void sendEmail(EmailDto email) throws EmailSendFailedException;
}
