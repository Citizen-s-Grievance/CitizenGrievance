package com.example.CitizenGrievance;


import com.example.CitizenGrievance.token.JwtAuthenticationToken;
import com.example.CitizenGrievance.util.JWTUtil;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

public class JWTAuthenticationProvider implements AuthenticationProvider {

    private final JWTUtil jwtUtil;
    private final UserDetailsService administrationService;  // ✅ admin
    private final UserDetailsService userEntityService;      // ✅ user

    // ✅ Updated constructor — takes both services
    public JWTAuthenticationProvider(JWTUtil jwtUtil,
                                     UserDetailsService administrationService,
                                     UserDetailsService userEntityService) {
        this.jwtUtil = jwtUtil;
        this.administrationService = administrationService;
        this.userEntityService = userEntityService;
    }

//    @Override
//    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
//        String token = ((JwtAuthenticationToken) authentication).getToken();
//
//        String username = jwtUtil.validateAndExtractUsername(token);
//        if (username == null) {
//            throw new BadCredentialsException("Invalid JWT Token");
//        }
//
//        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
//        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//    }

    @Override
    public Authentication authenticate(Authentication authentication)
            throws AuthenticationException {

        String token = ((JwtAuthenticationToken) authentication).getToken();
        Claims claims = jwtUtil.validateAndExtractClaims(token);

        if (claims == null) {
            throw new BadCredentialsException("Invalid token!");
        }

        // ✅ Block non-login tokens
        if (!"LOGIN".equals(claims.get("type"))) {
            throw new BadCredentialsException("Invalid token type!");
        }

        String username = claims.getSubject();
        String role     = claims.get("role", String.class);  // ✅ read role

        // ✅ Load correct user based on role
        UserDetails userDetails;
        if ("ROLE_ADMIN".equals(role)) {
            userDetails = administrationService.loadUserByUsername(username);
        } else {//"ROLE_USER".equals(role)
            userDetails = userEntityService.loadUserByUsername(username);
        }

        return new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return JwtAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
