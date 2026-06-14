package com.example.CitizenGrievance.services.email;

import com.example.CitizenGrievance.Threads.email.DeleteOTPTask;
import com.example.CitizenGrievance.entity.email.EmailOTP;
import com.example.CitizenGrievance.exceptions.InvalidOtpException;
import com.example.CitizenGrievance.exceptions.OTPExpired;
import com.example.CitizenGrievance.repository.email.EmailOTPRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Service
public class EmailOTPService {

    private static final int MAX_RESEND_ATTEMPTS = 3; // ✅ max resend limit

    @Autowired private EmailOTPRepo emailOTPRepo;
    @Autowired private EmailService emailService;
    @Autowired private ScheduledThreadPoolExecutor schedulePool;

    // ── Generate and Send OTP ──────────────────────────────────
    public String generateAndSendOtp(String email) {

        // ✅ Validate email
        if (!email.contains("@")) {
            throw new RuntimeException("Invalid email address!");
        }

        // ✅ Delete existing OTP if any
        emailOTPRepo.findByEmail(email)
                .ifPresent(emailOTPRepo::delete);

        String otp = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        EmailOTP emailOTP = emailOTPRepo.save(new EmailOTP(email, otp));
        schedulePool.schedule(
                new DeleteOTPTask(emailOTP.getId(), emailOTPRepo), 5, TimeUnit.MINUTES
        );
        emailService.sendOtp(email, otp);
        return "OTP sent successfully to: " + email;
    }

    // ── Resend OTP ─────────────────────────────────────────────
    public String resendOtp(String email) {

        // ✅ Check if email exists in OTP table
        Optional<EmailOTP> existing = emailOTPRepo.findByEmail(email);

        if (existing.isEmpty()) {
            throw new RuntimeException("No OTP request found! Please register first.");
        }

        EmailOTP existingOTP = existing.get();

        // ✅ Check resend limit
        if (existingOTP.getResendCount() >= MAX_RESEND_ATTEMPTS) {
            throw new RuntimeException(
                    "Maximum resend attempts (" + MAX_RESEND_ATTEMPTS + ") reached! " +
                            "Please register again."
            );
        }

        // ✅ Delete old OTP
        emailOTPRepo.delete(existingOTP);

        // ✅ Generate new OTP
        String newOtp = String.valueOf(100000 + new SecureRandom().nextInt(900000));

        // ✅ Save with incremented resend count
        EmailOTP newEmailOTP = new EmailOTP(email, newOtp);
        newEmailOTP.setResendCount(existingOTP.getResendCount() + 1); // increment
        EmailOTP saved = emailOTPRepo.save(newEmailOTP);

        // ✅ Schedule delete after 5 min
        schedulePool.schedule(
                new DeleteOTPTask(saved.getId(), emailOTPRepo), 5, TimeUnit.MINUTES
        );

        // ✅ Send new OTP
        emailService.sendOtp(email, newOtp);

        return "OTP resent successfully! Attempts remaining: "
                + (MAX_RESEND_ATTEMPTS - saved.getResendCount());
    }

    // ── Verify OTP ─────────────────────────────────────────────
    public boolean verifyOtp(String email, String otp) {

        Optional<EmailOTP> record = emailOTPRepo.findByEmailAndOtp(email, otp);

        if (record.isEmpty()) {
            return false;
//           throw new InvalidOtpException("Invalid OTP!");
        }

        EmailOTP otpVerification = record.get();

        if (LocalDateTime.now().isAfter(otpVerification.getExpiryTime())) {
            emailOTPRepo.delete(otpVerification);
            return false;
//            throw new OTPExpired("OTP expired! Please request a new one.");
        }

        emailOTPRepo.delete(otpVerification);
        return true;
//        return "OTP verified successfully!";
    }

    public void deleteOTP(int id) {
        emailOTPRepo.deleteById(id);
    }
}
