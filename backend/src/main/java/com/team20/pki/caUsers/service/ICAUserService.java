package com.team20.pki.caUsers.service;

import com.team20.pki.caUsers.dto.CAUserGetAllResponse;
import com.team20.pki.caUsers.dto.CAUserGetResponse;

import java.util.List;
import java.util.UUID;

public interface ICAUserService {
    List<CAUserGetAllResponse> getAllCaUsersWithCertificates();

    CAUserGetResponse getCaUserForCertificateIssue(UUID id);
}
