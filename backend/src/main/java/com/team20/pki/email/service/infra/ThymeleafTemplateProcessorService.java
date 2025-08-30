package com.team20.pki.email.service.infra;

import com.team20.pki.email.dto.ActivationEmailBodyDto;
import com.team20.pki.email.dto.InvitationEmailBodyDto;
import com.team20.pki.email.service.TemplateProcessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
public class ThymeleafTemplateProcessorService implements TemplateProcessorService {
    private final SpringTemplateEngine templateEngine;

    @Override
    public String getActivationEmailBody(ActivationEmailBodyDto dto) {
        Context context = new Context();
        context.setVariable("name", dto.getName());
        context.setVariable("activationUrl", dto.getActivationUrl());

        return templateEngine.process("activate", context);
    }

    @Override
    public String getInvitationEmailBody(InvitationEmailBodyDto dto) {
        Context context = new Context();
        context.setVariable("name", dto.getName());
        context.setVariable("organization", dto.getOrganization());
        context.setVariable("activationUrl", dto.getActivationUrl());

        return templateEngine.process("invite", context);
    }
}
