package com.example.CitizenGrievance.dtos;

public class LoginRequest {

    private String username;
    private String password;
    private String userType; // ✅ "ADMIN" or "USER"
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }
}
