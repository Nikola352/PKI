package com.team20.pki.common.service;


import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

public interface IUserService {
    List<UserCertificateIssueResponseDTO> getUsersForCertificateIssue(UserDetailsImpl user);

    UserCertificateIssueResponseDTO getUser(UUID id);
}
