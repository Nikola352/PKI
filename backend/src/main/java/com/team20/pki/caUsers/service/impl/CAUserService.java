package com.team20.pki.caUsers.service.impl;

import com.team20.pki.caUsers.dto.CAUserGetAllResponse;
import com.team20.pki.caUsers.dto.CAUserGetResponse;
import com.team20.pki.caUsers.service.ICAUserService;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class CAUserService implements ICAUserService {
    private final UserRepository userRepository;
    private final ICertificateRepository certificateRepository;

    public List<CAUserGetAllResponse> getAllCaUsersWithCertificates() {
        List<User> caUSers = userRepository.findUsersByRole(User.Role.CA_USER);
        return caUSers.stream().map(user -> {
            List<CAUserGetAllResponse.Certificate> userCertificates = certificateRepository.findByOwnerId(user.getId())
                    .stream().map(this::createUserCertificateResponse).toList();

            int issuedByUserCound = certificateRepository.countIssuedCertificatesByParentId(user.getId());

            return new CAUserGetAllResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getOrganization(),
                    issuedByUserCound,
                    userCertificates.size(),
                    userCertificates);
        }).toList();
    }


    private CAUserGetAllResponse.Certificate createUserCertificateResponse(Certificate certificate) {
        return new CAUserGetAllResponse.Certificate(
                certificate.getId(),
                certificate.getSerialNumber(),
                certificate.getValidFrom().toString(),
                certificate.getValidTo().toString(),
                CAUserGetAllResponse.Certificate.Status.ACTIVE,// promeniti
                certificate.getType().toString());
    }
}
