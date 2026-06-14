package com.example.CitizenGrievance.dtos;

public class AdministrationRegistrationRequest {


    private String name;
    private String email;


    private String phoneNumber;
    private String district;
    private String department;

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
