package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.dtos.UserRegistrationRequest;
import com.example.CitizenGrievance.entity.UserEntity;
import com.example.CitizenGrievance.exceptions.InvalidOtpException;
import com.example.CitizenGrievance.exceptions.SessionExpiredException;
import com.example.CitizenGrievance.exceptions.UserAlreadyExistsException;
import com.example.CitizenGrievance.repository.AdministrationRepo;
import com.example.CitizenGrievance.repository.UserEntityRepo;
import com.example.CitizenGrievance.services.email.EmailOTPService;
import com.example.CitizenGrievance.util.JWTUtil;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserRegistrationService {

    @Autowired
    private UserEntityRepo userEntityRepository;
    @Autowired private EmailOTPService emailOTPService;     // ✅ reuse same
    @Autowired private JWTUtil jwtUtil;                     // ✅ reuse same
    @Autowired private PasswordEncoder passwordEncoder;


    // STEP 1: Validate → Generate JWT → Send OTP
    public Map<String, String> initiateRegistration(
            UserRegistrationRequest request) {

        // ✅ Check duplicates
        if (userEntityRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered!");
        }
        if (userEntityRepository.existsByAadharNumber(request.getAadharNumber())) {
            throw new UserAlreadyExistsException("Aadhar number already registered!");
        }
        if (userEntityRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new UserAlreadyExistsException("Phone number already registered!");
        }

        // ✅ Generate registration JWT — pack details inside
        String token = jwtUtil.generateUserRegistrationToken(request);

        // ✅ Send OTP — reuse same EmailOTPService
        emailOTPService.generateAndSendOtp(request.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("registrationToken FOR User Registration", token);
        response.put("message", "OTP sent to " + request.getEmail());
        response.put("expiresIn", "5 minutes");
        return response;
    }

    // STEP 2: Verify OTP + JWT → Save to DB
    @Transactional
    public String completeRegistration(String token, String otp,
                                       String username, String password) {

        // ✅ Check token type
        if (!"USER_REGISTRATION".equals(jwtUtil.getTokenType(token))) {
            throw new SessionExpiredException("Invalid token type!");
        }

        // ✅ Check token not expired
        if (jwtUtil.isTokenExpired(token)) {
            throw new SessionExpiredException(
                    "Session expired! Please register again."
            );
        }

        // Check in user table
        if (userEntityRepository.findByUsername(username).isPresent()) {
            throw new UserAlreadyExistsException("Username already taken!please try different username!");
        }



        // ✅ Extract details from JWT — no DB read needed
        Claims claims     = jwtUtil.validateAndExtractClaims(token);
        String email      = claims.get("email",       String.class);
        String name       = claims.get("name",        String.class);
        String phone      = claims.get("phoneNumber", String.class);
        String aadhar     = claims.get("aadharNumber",String.class);
        String address    = claims.get("address",     String.class);
        String district   = claims.get("district",    String.class);
        String state      = claims.get("state",       String.class);
        String pinCode    = claims.get("pinCode",     String.class);

        // ✅ Verify OTP — reuse same EmailOTPService
        if (!emailOTPService.verifyOtp(email, otp)) {
            throw new InvalidOtpException("Invalid or expired OTP!");
        }

        // ✅ Save user — first and only DB write
        UserEntity user = new UserEntity(
                "ROLE_USER",
                aadhar, name, phone, email,
                address, district, state, pinCode,
                username,
                passwordEncoder.encode(password)
        );
        userEntityRepository.save(user);

        return "Registration successful! Please login.";
    }
}
