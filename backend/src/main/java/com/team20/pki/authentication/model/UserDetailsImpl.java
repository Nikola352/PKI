package com.team20.pki.authentication.model;

import com.team20.pki.common.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.UUID;

import static com.team20.pki.common.model.User.Role.ADMINISTRATOR;
import static com.team20.pki.common.model.User.Role.CA_USER;

public class UserDetailsImpl implements UserDetails {
    @Getter
    private final UUID userId;

    private final String username;

    private final String password;

    @Getter
    private final User.Role userRole;

    public UserDetailsImpl(UUID userId, String username, User.Role userRole) {
        this.userId = userId;
        this.username = username;
        this.password = null;
        this.userRole = userRole;
    }

    public UserDetailsImpl(User user) {
        userId = user.getId();
        username = user.getEmail();
        password = user.getPassword();
        userRole = user.getRole();
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        if(userRole == CA_USER || userRole == ADMINISTRATOR) {
            authorities.add(new SimpleGrantedAuthority("ROLE_CA"));
        }
        if(userRole == ADMINISTRATOR) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMINISTRATOR"));
        }
        return authorities;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
