package com.team20.pki.email.service;

import com.team20.pki.email.dto.EmailDto;
import com.team20.pki.email.exception.EmailSendFailedException;
import com.team20.pki.authentication.model.RegisterRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class EmailService {
    private final EmailGeneratorService emailGeneratorService;
    private final EmailSenderService emailSenderService;

    @Async
    public void sendAccountActivationEmail(RegisterRequest registerRequest, String verificationCode) {
        EmailDto email = emailGeneratorService.getAccountActivationEmail(registerRequest, verificationCode);
        try {
            emailSenderService.sendEmail(email);
        } catch (EmailSendFailedException e) {
            log.warn("Failed to send account activation email for request: {}", registerRequest.getId());
        }
    }

    @Async
    public void sendInvitationEmail(RegisterRequest registerRequest, String verificationCode) {
        EmailDto email = emailGeneratorService.getInvitationEmail(registerRequest, verificationCode);
        try {
            emailSenderService.sendEmail(email);
        } catch (EmailSendFailedException e) {
            log.warn("Failed to send invitation email for request: {}", registerRequest.getId());
        }
    }
}
