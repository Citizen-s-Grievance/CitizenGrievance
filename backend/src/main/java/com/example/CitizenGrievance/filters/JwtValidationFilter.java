package com.example.CitizenGrievance.filters;

import com.example.CitizenGrievance.token.JwtAuthenticationToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class JwtValidationFilter extends OncePerRequestFilter {

    private final AuthenticationManager authenticationManager;

    // ✅ List of public endpoints to skip
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/register/admin/initiate",
            "/register/admin/verify",
            "/register/user/initiate",
            "/register/user/verify",
            "/generate-token"
    );

    public JwtValidationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

        // ✅ Skip public endpoints completely
        if (PUBLIC_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractJwtFromRequest(request);

        if (token != null) {
            try {
                JwtAuthenticationToken authenticationToken =
                        new JwtAuthenticationToken(token);
                Authentication authResult =
                        authenticationManager.authenticate(authenticationToken);

                if (authResult.isAuthenticated()) {
                    SecurityContextHolder.getContext()
                            .setAuthentication(authResult);
                }
            } catch (Exception e) {
                // ✅ Clear context on invalid token
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid or expired token!");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
