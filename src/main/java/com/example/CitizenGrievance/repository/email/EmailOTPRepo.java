package com.example.CitizenGrievance.repository.email;

import com.example.CitizenGrievance.entity.email.EmailOTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailOTPRepo extends JpaRepository<EmailOTP, Integer> {
    Optional<EmailOTP> findByEmailAndOtp(String email, String otp);
    Optional<EmailOTP> findByEmail(String email);  // ✅ needed for resend
}