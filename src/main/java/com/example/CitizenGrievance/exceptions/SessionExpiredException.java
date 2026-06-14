package com.example.CitizenGrievance.exceptions;
// For expired token/session
public class SessionExpiredException extends RuntimeException {
    public SessionExpiredException(String message) {
        super(message);
    }
}
