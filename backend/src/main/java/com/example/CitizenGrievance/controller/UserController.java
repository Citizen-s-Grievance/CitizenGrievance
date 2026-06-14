package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.dtos.ComplaintRequest;
import com.example.CitizenGrievance.dtos.UserRegistrationRequest;
import com.example.CitizenGrievance.exceptions.InvalidOtpException;
import com.example.CitizenGrievance.exceptions.SessionExpiredException;
import com.example.CitizenGrievance.exceptions.UserAlreadyExistsException;
import com.example.CitizenGrievance.services.ComplaintService;
import com.example.CitizenGrievance.services.UserRegistrationService;
import com.example.CitizenGrievance.util.JWTUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@CrossOrigin(origins = "http://localhost:5173/")
@RestController
@RequestMapping("/register/user")
public class UserController {

    @Autowired
    private UserRegistrationService userRegistrationService;
    @Autowired private JWTUtil jwtUtil;

    @Autowired
    private ComplaintService complaintService;

    // STEP 1: Submit details → get registration JWT
    @PostMapping("/initiate")
    public ResponseEntity initiateRegistration(
            @Valid @RequestBody UserRegistrationRequest request) {
        try {
            return new ResponseEntity<>(
                    userRegistrationService.initiateRegistration(request),
                    HttpStatus.OK
            );
        } catch (UserAlreadyExistsException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // STEP 2: Verify OTP → save user
    @PostMapping("/verify")
    public ResponseEntity verify(
            @RequestHeader("Authorization") String token,
            @RequestParam String otp,
            @RequestParam String username,
            @RequestParam String password) {
        try {
            String jwt = token.replace("Bearer ", "");

            // ✅ Block wrong token types
            if (!"USER_REGISTRATION".equals(jwtUtil.getTokenType(jwt))) {
                return new ResponseEntity<>(
                        "Invalid token type!", HttpStatus.FORBIDDEN
                );
            }

            return new ResponseEntity<>(
                    userRegistrationService.completeRegistration(
                            jwt, otp, username, password
                    ),
                    HttpStatus.OK
            );
        } catch (SessionExpiredException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (InvalidOtpException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}