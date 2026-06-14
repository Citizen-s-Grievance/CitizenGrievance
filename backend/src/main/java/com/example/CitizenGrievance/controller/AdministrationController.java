package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.dtos.AdministrationRegistrationRequest;
import com.example.CitizenGrievance.exceptions.*;
import com.example.CitizenGrievance.services.AdministrationRegistrationService;
import com.example.CitizenGrievance.services.email.EmailOTPService;
import com.example.CitizenGrievance.util.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@CrossOrigin(origins = "http://localhost:5173/")
@RestController
@RequestMapping("/register/admin")
public class AdministrationController {

    @Autowired
    private AdministrationRegistrationService administrationRegistrationService;
    @Autowired
    private JWTUtil jwtUtil;
    @Autowired
    EmailOTPService emailOTPService;

    // STEP 1: Submit details → get registration JWT
    @PostMapping("/initiate")
    public ResponseEntity initiate(@RequestBody AdministrationRegistrationRequest request) {
        try {
            Map<String, String> response =
                    administrationRegistrationService.initiateRegistration(request);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
        catch (UserAlreadyExistsException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
        catch (DistrictAndDepartmentException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
        catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // STEP 2: Submit OTP + registration JWT → save user
    @PostMapping("/verify")
    public ResponseEntity verify(
            @RequestHeader("Authorization") String token,
            @RequestParam String otp,
            @RequestParam String username,
            @RequestParam String password) {
        try {

            String jwt = token.replace("Bearer ", "");

            // ✅ Block login tokens
            if (!"REGISTRATION".equals(jwtUtil.getTokenType(jwt))) {
                return ResponseEntity.status(403)
                        .body("❌ Invalid token type!");
            }

            String result = administrationRegistrationService.completeRegistration(
                    jwt, otp, username, password
            );
            return new ResponseEntity<>(result, HttpStatus.OK);

        }
        catch (SessionExpiredException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
        catch (InvalidOtpException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
        catch (UserAlreadyExistsException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
        catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }



}
