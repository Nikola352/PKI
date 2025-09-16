package com.team20.pki.email.service;

import com.team20.pki.email.dto.ActivationEmailBodyDto;
import com.team20.pki.email.dto.InvitationEmailBodyDto;

public interface TemplateProcessorService {
    String getActivationEmailBody(ActivationEmailBodyDto dto);

    String getInvitationEmailBody(InvitationEmailBodyDto bodyDTO);
}
