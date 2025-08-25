package com.team20.pki.email.service;

import com.team20.pki.email.dto.ActivationEmailBodyDto;

public interface TemplateProcessorService {
    String getActivationEmailBody(ActivationEmailBodyDto dto);
}
