package com.team20.pki.common.controller;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import com.team20.pki.common.dto.UserGetAllResponse;
import com.team20.pki.common.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/api/users")
public class UserController {
    private final IUserService userService;

    @GetMapping("/certificate-issue")
    @Secured("ROLE_CA")
    public ResponseEntity<List<UserCertificateIssueResponseDTO>> getUsersForCertificateIssue(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(userService.getUsersForCertificateIssue(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserCertificateIssueResponseDTO> getUser(@PathVariable(name = "id") UUID id) {
        return  ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping("/regular")
    @Secured("ROLE_ADMINISTRATOR")
    public ResponseEntity<List<UserGetAllResponse>> getRegularUsers() {
        return  ResponseEntity.ok(userService.getAllRegularUsers());
    }
}


