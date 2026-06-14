package com.example.CitizenGrievance.services;


import com.example.CitizenGrievance.dtos.AdministrationRegistrationRequest;
import com.example.CitizenGrievance.entity.Administration;
import com.example.CitizenGrievance.entity.District;
import com.example.CitizenGrievance.entity.MunicipalProblems;
import com.example.CitizenGrievance.exceptions.DistrictAndDepartmentException;
import com.example.CitizenGrievance.exceptions.SessionExpiredException;
import com.example.CitizenGrievance.exceptions.UserAlreadyExistsException;
import com.example.CitizenGrievance.repository.AdministrationRepo;
import com.example.CitizenGrievance.repository.DistrictRepo;
import com.example.CitizenGrievance.repository.MunicipalProblemsRepo;
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
public class AdministrationRegistrationService {

    @Autowired
    private JWTUtil jwtUtil;
    @Autowired
    private EmailOTPService emailOTPService;
    @Autowired private AdministrationRepo administrationRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DistrictRepo districtRepo;


    @Autowired
    private MunicipalProblemsRepo municipalProblemsRepo;

    // STEP 1: Validate → Generate Registration JWT → Send OTP
    public Map<String, String> initiateRegistration(AdministrationRegistrationRequest request) {

        if (administrationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("Email already registered!");
        }

        //you should handel  district and department exception also
        String municipalProblem=request.getDepartment();
        String district=request.getDistrict();
        // ✅ Validate department exists
        MunicipalProblems municipalProblemsObj = municipalProblemsRepo
                .findByMunicipalProblemName(municipalProblem)
                .orElseThrow(() -> new RuntimeException(
                        "Department '" + municipalProblem + "' not found!"
                ));

// ✅ Validate district exists
        District districtObj = districtRepo
                .findByDistrictName(district)
                .orElseThrow(() -> new RuntimeException(
                        "District '" + district + "' not found!"
                ));
        int municipalProblemId=municipalProblemsObj.getMunicipalProblemId();
        int districtId=districtObj.getDistrictId();

        String combine=""+districtId+municipalProblemId;
        Administration administration=administrationRepository.getAdministrationByAdministrationId(combine);

            if(administration.getEmail()!=null){
                throw new DistrictAndDepartmentException("District and Department  already registered !");
            }

//



        // ✅ Generate registration JWT (no DB write yet)
        String token = jwtUtil.generateRegistrationToken(request);

        // Send OTP
            emailOTPService.generateAndSendOtp(request.getEmail());

        Map<String, String> response = new HashMap<>();
        response.put("registrationToken FOR Administration Registration ", token);
        response.put("message", "OTP sent to " + request.getEmail());
        response.put("expiresIn", "5 minutes");
        return response;
    }

    // STEP 2: Verify OTP + Registration JWT → Save to DB
    @Transactional
    public String completeRegistration(String token, String otp,
                                       String username, String password) {

        // ✅ Check it's a registration token
        if (!"REGISTRATION".equals(jwtUtil.getTokenType(token))) {
            throw new SessionExpiredException("Invalid token type!");
        }



        // ✅ Check token not expired
        if (jwtUtil.isTokenExpired(token)) {
            throw new SessionExpiredException("Session expired! Please register again.");
        }



        if (administrationRepository.findByUsername(username).isPresent()) {
            throw new UserAlreadyExistsException("Username already taken! please try different username!");
        }



        // ✅ Extract details from JWT
        Claims claims     = jwtUtil.validateAndExtractClaims(token);
        String email      = claims.get("email",       String.class);
        String name       = claims.get("name",        String.class);
        String phone      = claims.get("phoneNumber", String.class);
        String district   = claims.get("district",    String.class);
        String department = claims.get("department",  String.class);

      //   ✅ Verify OTP
        if (!emailOTPService.verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid or expired OTP!");
        }

        // ✅ First and ONLY DB write
//        int municipalProblemId=municipalProblemsRepo.findMunicipalProblemsByMunicipalProblemName(department);
//        int districtId=districtRepo.findDistrictByDistrictName(district);


        MunicipalProblems municipalProblemsObj = municipalProblemsRepo
                .findByMunicipalProblemName(department)
                .orElseThrow(() -> new RuntimeException(
                        "Department '" + department + "' not found!"
                ));

// ✅ Validate district exists
        District districtObj = districtRepo
                .findByDistrictName(district)
                .orElseThrow(() -> new RuntimeException(
                        "District '" + district + "' not found!"
                ));
        int municipalProblemId=municipalProblemsObj.getMunicipalProblemId();
        int districtId=districtObj.getDistrictId();
        String combine=""+districtId+municipalProblemId;

        Administration admin = administrationRepository.getAdministrationByAdministrationId(combine);
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setEmail(email);
        admin.setName(name);
        admin.setPhoneNumber(phone);
        admin.setDistrict(district);
        admin.setDepartment(department);
        admin.setRole("ROLE_ADMIN");
        administrationRepository.save(admin);

        return "Registration successful! Please login.";
    }
}