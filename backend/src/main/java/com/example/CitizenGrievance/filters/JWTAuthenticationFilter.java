package com.example.CitizenGrievance.filters;


import com.example.CitizenGrievance.dtos.LoginRequest;
import com.example.CitizenGrievance.util.JWTUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationManager authenticationManager;
    private final JWTUtil jwtUtil;

    public JWTAuthenticationFilter(AuthenticationManager authenticationManager,
                                   JWTUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // ✅ Only process login requests
        if (!request.getServletPath().equals("/generate-token")) {
            filterChain.doFilter(request, response);
            return;
        }
        //.equals("/generate-token")
// // ✅ Login token — 2 hours is generated if the credential are correct
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            LoginRequest loginRequest = objectMapper.readValue(
                    request.getInputStream(), LoginRequest.class
            );

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword(),
                            List.of(new SimpleGrantedAuthority(loginRequest.getUserType()))
                    );

            Authentication authResult = authenticationManager.authenticate(authToken);

            if (authResult.isAuthenticated()) {

                // ✅ Extract role from authenticated user
                String role = authResult.getAuthorities()
                        .iterator()
                        .next()
                        .getAuthority();  // "ROLE_ADMIN" or "ROLE_USER"

                // ✅ Pass role into token
                String accessToken = jwtUtil.generateLoginToken(
                        authResult.getName(), 120, role
                );

                response.setContentType("application/json");
                response.getWriter().write(
                        "{ \"token\": \"Bearer " + accessToken + "\", " +
                                "  \"role\": \"" + role + "\", " +
                                "  \"expiresIn\": \"2 hours\" }"
                );
            }

        } catch (Exception e) {
            System.out.println(e.getMessage());
            // ✅ Handle wrong credentials
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid username or password!");
        }
    }
}
