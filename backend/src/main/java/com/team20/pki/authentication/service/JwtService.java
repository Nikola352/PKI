package com.team20.pki.authentication.service;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.config.properties.AuthConfigProperties;
import com.team20.pki.common.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class JwtService {
    private static final String AUTH_HEADER = "Authorization";
    private static final String HEADER_PREFIX = "Bearer ";

    private final AuthConfigProperties authConfig;
    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        try {
            byte[] keyBytes = Hex.decodeHex(authConfig.getSecretKey());
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (DecoderException e) {
            throw new RuntimeException(e);
        }
    }

    public String generateAccessToken(UserDetailsImpl userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("user_id", userDetails.getUserId().toString())
                .claim("role", userDetails.getUserRole().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + authConfig.getAccessTokenExpirationTimeMs()))
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public boolean isTokenValid(String token) {
        try {
            getAllClaimsFromToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
    }

    public String getToken(HttpServletRequest request) {
        final String authHeader = request.getHeader(AUTH_HEADER);
        if (authHeader != null && authHeader.startsWith(HEADER_PREFIX)) {
            return authHeader.substring(HEADER_PREFIX.length());
        }
        return null;
    }

    public UserDetails getUserDetailsFromToken(String token) {
        final Claims claims = getAllClaimsFromToken(token);
        if (claims == null) {
            return null;
        }
        return new UserDetailsImpl(
                UUID.fromString(claims.get("user_id", String.class)),
                claims.getSubject(),
                User.Role.valueOf(claims.get("role", String.class))
        );
    }
}