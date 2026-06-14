package com.example.CitizenGrievance.exceptions;

public class OTPExpired extends RuntimeException {
    public OTPExpired(String message) {
        super(message);
    }
}
