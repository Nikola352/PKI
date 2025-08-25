package com.team20.pki.authentication.service;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.authentication.dto.*;
import com.team20.pki.config.properties.AuthConfigProperties;
import com.team20.pki.encryption.service.CryptoHashService;
import com.team20.pki.email.service.EmailService;
import com.team20.pki.common.exception.InvalidRequestError;
import com.team20.pki.common.exception.NotFoundError;
import com.team20.pki.authentication.exception.UnauthenticatedError;
import com.team20.pki.common.mapper.UserMapper;
import com.team20.pki.authentication.model.RegisterRequest;
import com.team20.pki.common.model.User;
import com.team20.pki.authentication.repository.RegisterRequestRepository;
import com.team20.pki.common.repository.UserRepository;
import com.team20.pki.util.SecureRandomGenerator;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.Cookie;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int VERIFICATION_CODE_LENGTH = 64;
    private static final long REGISTRATION_REQUEST_CLEANUP_PERIOD_MILLIS = 1000 * 60 * 60 * 24; // 1 day

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CryptoHashService cryptoHashService;
    private final RegisterRequestRepository registerRequestRepository;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    private final AuthConfigProperties authConfig;
    private Duration activationDuration;

    @PostConstruct
    public void init() {
        activationDuration = Duration.ofMinutes(authConfig.getActivationCodeExpirationMinutes());
    }

    public RegisterResponseDto register(@Valid RegisterRequestDto registerRequestDto) {
        if(userRepository.existsByEmail(registerRequestDto.getEmail())) {
            throw new InvalidRequestError("User with this email already exists");
        }

        String verificationCode = SecureRandomGenerator.generateCode(VERIFICATION_CODE_LENGTH);

        RegisterRequest request = RegisterRequest.builder()
                .verificationCode(cryptoHashService.hash(verificationCode))
                .expirationTime(Instant.now().plus(activationDuration))
                .email(registerRequestDto.getEmail())
                .password(passwordEncoder.encode(registerRequestDto.getPassword()))
                .firstName(registerRequestDto.getFirstName())
                .lastName(registerRequestDto.getLastName())
                .organization(registerRequestDto.getOrganization())
                .build();

        emailService.sendAccountActivationEmail(request, verificationCode);

        registerRequestRepository.save(request);

        return new RegisterResponseDto(request.getEmail(), request.getFullName());
    }

    public void activateAccount(@Valid VerificationCodeRequestDto verificationCodeDto) {
        String codeHash = cryptoHashService.hash(verificationCodeDto.getVerificationCode());
        RegisterRequest request = registerRequestRepository.findByVerificationCode(codeHash)
                .orElseThrow(() -> new NotFoundError("Activation link invalid or expired"));

        if(userRepository.existsByEmail(request.getEmail())) {
            throw new InvalidRequestError("User with this email already exists");
        }

        if (request.getExpirationTime().isBefore(Instant.now())) {
            registerRequestRepository.delete(request);
            throw new NotFoundError("Activation link invalid or expired");
        }

        User user = userMapper.toUser(request);
        userRepository.save(user);
        registerRequestRepository.delete(request);
    }

    @Scheduled(fixedRate = REGISTRATION_REQUEST_CLEANUP_PERIOD_MILLIS)
    @Transactional
    public void cleanExpiredRequests() {
        registerRequestRepository.deleteAllExpired();
    }

    public LoginResultDto login(@Valid LoginRequestDto loginRequestDto) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(loginRequestDto.getEmail(), loginRequestDto.getPassword());

        try {
            Authentication authentication = authenticationManager.authenticate(auth);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            User user = userRepository.findById(userDetails.getUserId())
                    .orElseThrow(() -> new UnauthenticatedError("Invalid credentials"));

            String jwt = jwtService.generateAccessToken(userDetails);
            Cookie refreshTokenCookie = refreshTokenService.getNewRefreshTokenCookie(userDetails.getUserId());

            LoginResponseDto loginResponseDto = new LoginResponseDto(
                    userDetails.getUserId(),
                    userDetails.getUsername(),
                    user.getFullName(),
                    userDetails.getUserRole(),
                    jwt
            );

            return new LoginResultDto(loginResponseDto, refreshTokenCookie);
        } catch (DisabledException e) {
            throw new UnauthenticatedError("Account has been deactivated");
        } catch (BadCredentialsException e) {
            throw new UnauthenticatedError("Invalid credentials");
        } catch (AuthenticationException e) {
            throw new UnauthenticatedError(e.getMessage());
        }
    }
}
