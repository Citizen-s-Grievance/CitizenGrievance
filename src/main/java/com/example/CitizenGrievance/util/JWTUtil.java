package com.example.CitizenGrievance.util;


import com.example.CitizenGrievance.dtos.AdministrationRegistrationRequest;
import com.example.CitizenGrievance.dtos.UserRegistrationRequest;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JWTUtil {

    private static final String SECRET_KEY = "your-secure-secret-key-min-32bytes";//you can insert your secret key here
    private static final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));//this is algorithm for decoding in cryptography


    // ✅ Login Token — 120 min access token
//    public String generateLoginToken(String username, long expiryMinutes) {
//        return Jwts.builder()
//                .setSubject(username)
//                .claim("type", "LOGIN")               // ← token type
//                .setIssuedAt(new Date())
//                .setExpiration(new Date(System.currentTimeMillis()
//                        + expiryMinutes * 60 * 1000))
//                .signWith(key, SignatureAlgorithm.HS256)
//                .compact();
//    }

    // ✅ Updated — include role in token
    public String generateLoginToken(String username, long expiryMinutes, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("type", "LOGIN")
                .claim("role", role)          // ✅ ROLE_ADMIN or ROLE_USER
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()
                        + expiryMinutes * 60 * 1000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    // ✅ Registration Token — 5 min, carries user details
    // ✅ Existing — Admin registration token
    public String generateRegistrationToken(AdministrationRegistrationRequest request) {
        return Jwts.builder()
                .setSubject(request.getEmail())
                .claim("type",        "REGISTRATION") // ← token type
                .claim("name",        request.getName())
                .claim("email",       request.getEmail())
                .claim("phoneNumber", request.getPhoneNumber())
                .claim("district",    request.getDistrict())
                .claim("department",  request.getDepartment())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis()
                        + 5 * 60 * 1000))                 // 5 min
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ✅ New — User registration token
    public String generateUserRegistrationToken(UserRegistrationRequest request) {
        return Jwts.builder()
                .setSubject(request.getEmail())
                .claim("type",         "USER_REGISTRATION")  // ← different type
                .claim("name",         request.getName())
                .claim("email",        request.getEmail())
                .claim("phoneNumber",  request.getPhoneNumber())
                .claim("aadharNumber", request.getAadharNumber())
                .claim("address",      request.getAddress())
                .claim("district",     request.getDistrict())
                .claim("state",        request.getState())
                .claim("pinCode",      request.getPinCode())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 5 * 60 * 1000))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
    // ✅ Validate and extract claims
    public Claims validateAndExtractClaims(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            return null;
        }
    }

    // ✅ Extract username (for login token)
    public String validateAndExtractUsername(String token) {
        try {
            Claims claims = validateAndExtractClaims(token);
            if (claims == null) return null;

            // ✅ Block registration tokens from login flow
            if ("REGISTRATION".equals(claims.get("type"))) {
                return null;
            }
            return claims.getSubject();
        } catch (JwtException e) {
            return null;
        }
    }

    // ✅ Check token type
    public String getTokenType(String token) {
        Claims claims = validateAndExtractClaims(token);
        return claims != null ? (String) claims.get("type") : null;
    }

    // ✅ Check expiry
    public boolean isTokenExpired(String token) {
        Claims claims = validateAndExtractClaims(token);
        return claims == null || claims.getExpiration().before(new Date());
    }
}
