package com.team20.pki.common.service;


import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface IUserService {
    List<UserCertificateIssueResponseDTO> getUsersForCertificateIssue();
}
