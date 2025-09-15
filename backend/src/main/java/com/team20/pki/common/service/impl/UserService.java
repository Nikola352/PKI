package com.team20.pki.common.service.impl;

import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import com.team20.pki.common.service.IUserService;
import com.team20.pki.util.ValidationPatterns;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final UserRepository userRepository;

    @Override
    public List<UserCertificateIssueResponseDTO> getUsersForCertificateIssue() {
        return userRepository.findAll().stream().map(
                user -> new UserCertificateIssueResponseDTO(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getOrganization(),
                        user.getRole().toString()
                )).toList();
    }
}
