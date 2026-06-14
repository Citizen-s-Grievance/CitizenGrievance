package com.example.CitizenGrievance.exceptions;
// For duplicate email/username
public class UserAlreadyExistsException extends RuntimeException {
    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
