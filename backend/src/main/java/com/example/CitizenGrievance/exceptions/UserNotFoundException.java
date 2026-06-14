package com.example.CitizenGrievance.exceptions;

// For user not found
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
