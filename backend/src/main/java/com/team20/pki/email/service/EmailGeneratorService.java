package com.team20.pki.email.service;

import com.team20.pki.email.dto.ActivationEmailBodyDto;
import com.team20.pki.email.dto.EmailDto;
import com.team20.pki.authentication.model.RegisterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailGeneratorService {
    private final TemplateProcessorService templateProcessorService;

    private final String frontendUrl;

    public EmailGeneratorService(
            TemplateProcessorService templateProcessorService,
            @Value("${frontend-url}") String frontendUrl
    ) {
        this.templateProcessorService = templateProcessorService;
        this.frontendUrl = frontendUrl;
    }

    public EmailDto getAccountActivationEmail(RegisterRequest registrationRequest, String verificationCode) {
        final String email = registrationRequest.getEmail();

        final String activationUrl = frontendUrl + "/user/activate?code=" + verificationCode;
        final ActivationEmailBodyDto bodyDTO = new ActivationEmailBodyDto(
                registrationRequest.getFirstName(),
                activationUrl
        );
        final String body = templateProcessorService.getActivationEmailBody(bodyDTO);

        return new EmailDto(email, "PKI Account Activation", body);
    }
}
