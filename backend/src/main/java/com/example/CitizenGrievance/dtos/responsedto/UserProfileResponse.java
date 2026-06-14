package com.example.CitizenGrievance.dtos.responsedto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileResponse {
    private String name;
    private String username;
    private String role;
    private String aadharNumber;
    private String phoneNumber;
    private String email;
    private String address;
    private String district;
    private String state;
    private String pinCode;
}