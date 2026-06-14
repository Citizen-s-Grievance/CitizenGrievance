package com.example.CitizenGrievance;

import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

public class UserTypeAwareDaoProvider implements AuthenticationProvider {

    private final UserDetailsService administrationService;
    private final UserDetailsService userEntityService;
    private final PasswordEncoder passwordEncoder;

    public UserTypeAwareDaoProvider(UserDetailsService administrationService,
                                    UserDetailsService userEntityService,
                                    PasswordEncoder passwordEncoder) {
        this.administrationService = administrationService;
        this.userEntityService = userEntityService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Authentication authenticate(Authentication authentication)
            throws AuthenticationException {

        String username = authentication.getName();
        String password = authentication.getCredentials().toString();

        // ✅ Read userType from authorities
        String userType = authentication.getAuthorities()
                .iterator()
                .next()
                .getAuthority();  // "ADMIN" or "USER"

        // ✅ Load from correct table based on userType
        UserDetails userDetails;
        if ("ADMIN".equals(userType)) {
            userDetails = administrationService.loadUserByUsername(username);
        } else if ("USER".equals(userType)) {
            userDetails = userEntityService.loadUserByUsername(username);
        } else {
            throw new BadCredentialsException("Invalid user type!");
        }

        // ✅ Verify password
        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid password!");
        }

        return new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class
                .isAssignableFrom(authentication);
    }
}
