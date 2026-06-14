package com.example.CitizenGrievance.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class MunicipalProblems {
    @Id
    private int municipalProblemId;
    private String municipalProblemName;

    public int getMunicipalProblemId() {
        return municipalProblemId;
    }

    public void setMunicipalProblemId(int municipalProblemId) {
        this.municipalProblemId = municipalProblemId;
    }

    public String getMunicipalProblemName() {
        return municipalProblemName;
    }

    public void setMunicipalProblemName(String municipalProblemName) {
        this.municipalProblemName = municipalProblemName;
    }

    public MunicipalProblems() {
    }

    public MunicipalProblems(int municipalProblemId, String municipalProblemName) {
        this.municipalProblemId = municipalProblemId;
        this.municipalProblemName = municipalProblemName;
    }

    @Override
    public String toString() {
        return "MunicipalProblems{" +
                "municipalProblemId=" + municipalProblemId +
                ", municipalProblemName='" + municipalProblemName + '\'' +
                '}';
    }
}
