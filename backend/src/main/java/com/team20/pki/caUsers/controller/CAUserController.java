package com.team20.pki.caUsers.controller;

import com.team20.pki.caUsers.dto.CAUserGetAllResponse;
import com.team20.pki.caUsers.dto.CAUserGetResponse;
import com.team20.pki.caUsers.service.ICAUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping(value = "/api/ca-users")
public class CAUserController {

    private final ICAUserService caUserService;

    //@PreAuthorize("hasRole('ADMINISTRATOR')")
    @GetMapping
    ResponseEntity<Collection<CAUserGetAllResponse>> getAllCaUsers() {
        return ResponseEntity.ok(caUserService.getAllCaUsersWithCertificates());
    }
   // @PreAuthorize("hasRole('ADMINISTRATOR')")
//    @GetMapping(value = "/{id}")
//    ResponseEntity<CAUserGetResponse> getCaUserForCertificateIssue(@PathVariable UUID id) {
//        return ResponseEntity.ok(caUserService.getCaUserForCertificateIssue(id));
//    }
}
