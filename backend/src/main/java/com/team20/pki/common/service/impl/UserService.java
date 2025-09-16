package com.team20.pki.common.service.impl;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.caUsers.dto.CAUserGetResponse;
import com.team20.pki.common.dto.UserCertificateIssueResponseDTO;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import com.team20.pki.common.service.IUserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final UserRepository userRepository;
    public UserCertificateIssueResponseDTO getUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(EntityNotFoundException::new);
        return new UserCertificateIssueResponseDTO(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getOrganization(),
                user.getRole().toString()
        );
    }

    @Override
    public List<UserCertificateIssueResponseDTO> getUsersForCertificateIssue(UserDetailsImpl userDetails) {
        User user = userRepository.findById(userDetails.getUserId()).orElseThrow(() -> new EntityNotFoundException("User not found!"));

        return userRepository.findUsersByOrganizationIgnoreCase(user.getOrganization()).stream()
                .filter(member -> !user.getId().equals(member.getId()) && !member.getRole().equals(User.Role.ADMINISTRATOR))
                .map(
                        member -> new UserCertificateIssueResponseDTO(
                                member.getId(),
                                member.getEmail(),
                                member.getFirstName(),
                                member.getLastName(),
                                member.getOrganization(),
                                member.getRole().toString()
                        )
                ).toList();
    }
}
