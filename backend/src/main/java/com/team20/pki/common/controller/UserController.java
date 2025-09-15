package com.team20.pki.common.controller;

import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import com.team20.pki.common.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/api/users")
public class UserController {
    private final IUserService userService;

    @PreAuthorize("hasRole('CA_USER')")
    @GetMapping("/certificate-issue")
    public ResponseEntity<List<UserCertificateIssueResponseDTO>> getUsersForCertificateIssue() {
        return ResponseEntity.ok(userService.getUsersForCertificateIssue());
    }
}


