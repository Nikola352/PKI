package com.team20.pki.email.service.infra;

import com.team20.pki.config.properties.EmailConfigProperties;
import com.team20.pki.email.dto.EmailDto;
import com.team20.pki.email.exception.EmailSendFailedException;
import com.team20.pki.email.service.EmailSenderService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@RequiredArgsConstructor
public class JavaMailSenderService implements EmailSenderService {
    private final EmailConfigProperties config;
    private final JavaMailSender mailSender;

    @Override
    public void sendEmail(EmailDto email) throws EmailSendFailedException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message);

        try {
            helper.setFrom(config.getFromEmail(), config.getFromName());
            helper.setTo(email.getRecipientEmail());
            helper.setSubject(email.getSubject());
            helper.setText(email.getBody(), true);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new EmailSendFailedException(e.getMessage());
        }

        mailSender.send(message);
    }
}
