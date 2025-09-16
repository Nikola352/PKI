package com.team20.pki.authentication.controller;

import com.team20.pki.authentication.dto.*;
import com.team20.pki.authentication.exception.UnauthenticatedError;
import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.authentication.service.AuthService;
import com.team20.pki.authentication.service.JwtService;
import com.team20.pki.authentication.service.RefreshTokenService;
import com.team20.pki.common.dto.ErrorResponseDto;
import com.team20.pki.common.model.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDto> register(@Valid @RequestBody RegisterRequestDto registerRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(registerRequestDto));
    }

    @PostMapping("/activate")
    public ResponseEntity<Void> activateAccount(@Valid @RequestBody VerificationCodeRequestDto dto) {
        authService.activateAccount(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invite")
    @Secured("ROLE_ADMINISTRATOR")
    public ResponseEntity<RegisterResponseDto> inviteCaUser(@Valid @RequestBody InviteRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.inviteCaUser(dto));
    }

    @GetMapping("/verification-subject")
    public ResponseEntity<VerificationCheckResponseDto> getPendingVerificationSubject(
            @Valid @ModelAttribute VerificationCodeRequestDto dto
    ) {
        return ResponseEntity.ok(authService.getPendingVerificationSubject(dto));
    }

    @PostMapping("/activate/ca")
    public ResponseEntity<Void> activateCaAccount(@Valid @RequestBody CaVerificationRequestDto dto) {
        authService.activateAccount(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(
            @Valid @RequestBody LoginRequestDto loginRequestDto,
            HttpServletResponse response
    ) {
        LoginResultDto result = authService.login(loginRequestDto);
        response.addCookie(result.getRefreshTokenCookie());
        return ResponseEntity.ok(result.getLoginResponseDto());
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponseDto> refreshToken(
            @CookieValue(value = RefreshTokenService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        RefreshTokenVerificationResult result = refreshTokenService.verifyRefreshToken(refreshToken);
        if (result.isValid()) {
            Cookie refreshTokenCookie = refreshTokenService.getRotatedRefreshTokenCookie(result.getRefreshToken());
            String jwt = jwtService.generateAccessToken(new UserDetailsImpl(result.getRefreshToken().getUser()));
            response.addCookie(refreshTokenCookie);
            return ResponseEntity.ok(new TokenRefreshResponseDto(jwt));
        } else {
            Cookie refreshTokenCookie = refreshTokenService.getCleanRefreshTokenCookie();
            response.addCookie(refreshTokenCookie);
            throw new UnauthenticatedError("Logged out");
        }
    }

    /**
     * Refresh access token but return user data as well. Useful for initial page load.
     */
    @GetMapping("/refresh/user")
    public ResponseEntity<LoginResponseDto> getCurrentUser(
            @CookieValue(value = RefreshTokenService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        RefreshTokenVerificationResult result = refreshTokenService.verifyRefreshToken(refreshToken);
        if (result.isValid()) {
            Cookie refreshTokenCookie = refreshTokenService.getRotatedRefreshTokenCookie(result.getRefreshToken());
            response.addCookie(refreshTokenCookie);

            User user = result.getRefreshToken().getUser();
            String jwt = jwtService.generateAccessToken(new UserDetailsImpl(user));

            return ResponseEntity.ok(new LoginResponseDto(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole(),
                    jwt
            ));
        } else {
            Cookie refreshTokenCookie = refreshTokenService.getCleanRefreshTokenCookie();
            response.addCookie(refreshTokenCookie);
            throw new UnauthenticatedError("Logged out");
        }
    }

    @GetMapping(value = "/logout")
    public ResponseEntity<String> logout(
            @CookieValue(value = RefreshTokenService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        response.addCookie(refreshTokenService.getCleanRefreshTokenCookie());
        refreshTokenService.invalidateSession(refreshToken);
        return ResponseEntity.ok("Successfully logged out");
    }

    @GetMapping("/csrf-token")
    public ResponseEntity<String> getCsrfToken(CsrfToken token) {
        // The CsrfToken will be automatically included in the response as a cookie
        // However, it needs to be 'touched' in order to be generated.
        // Sending it in the response body is fine.
        return ResponseEntity.ok().body(token.getToken());
    }

    @ExceptionHandler(UnauthenticatedError.class)
    public ResponseEntity<ErrorResponseDto> handleUnauthenticatedError(UnauthenticatedError error) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new ErrorResponseDto(HttpStatus.UNAUTHORIZED.value(), error.getMessage())
        );
    }
}