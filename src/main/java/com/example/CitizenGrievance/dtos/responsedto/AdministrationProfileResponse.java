package com.example.CitizenGrievance.dtos.responsedto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdministrationProfileResponse {
    private String administrationId;
    private String username;
    private String email;
    private String name;
    private String phoneNumber;
    private String district;
    private String department;
}
