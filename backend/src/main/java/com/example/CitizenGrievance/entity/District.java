package com.example.CitizenGrievance.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class District {
    @Id
    private int districtId;
    private String districtName;

    public District() {

    }

    public District(int districtId, String districtName) {
        this.districtId = districtId;
        this.districtName = districtName;
    }

    public String getDistrictName() {
        return districtName;
    }

    public void setDistrictName(String districtName) {
        this.districtName = districtName;
    }

    public int getDistrictId() {
        return districtId;
    }

    public void setDistrictId(int districtId) {
        this.districtId = districtId;
    }

    @Override
    public String toString() {
        return "District{" +
                "districtId=" + districtId +
                ", districtName='" + districtName + '\'' +
                '}';
    }
}
