package com.example.CitizenGrievance.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ComplaintLocationDTO {
    private int    id;
    private double latitude;
    private double longitude;
    private String status;
    private String district;
    private String department;
}