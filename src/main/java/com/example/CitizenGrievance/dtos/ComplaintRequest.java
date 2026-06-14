package com.example.CitizenGrievance.dtos;

import java.math.BigDecimal;

public class ComplaintRequest {

    private BigDecimal latitude;
    private BigDecimal longitude;
    private String complaintsInWords;
    private String landmark;
    private String district;
    private String department;

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }


// getters and setters

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getComplaintsInWords() {
        return complaintsInWords;
    }

    public void setComplaintsInWords(String complaintsInWords) {
        this.complaintsInWords = complaintsInWords;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }
}
