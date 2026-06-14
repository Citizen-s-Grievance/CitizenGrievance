package com.example.CitizenGrievance.exceptions;
// For invalid OTP
public class InvalidOtpException extends RuntimeException {
    public InvalidOtpException(String message) {
        super(message);
    }
}
