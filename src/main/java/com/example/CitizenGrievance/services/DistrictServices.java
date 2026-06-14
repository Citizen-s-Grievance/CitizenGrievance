package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.entity.District;
import com.example.CitizenGrievance.repository.DistrictRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DistrictServices {
    @Autowired
    private DistrictRepo districtRepo;

    //Jointpoint
    public void districtServiceAop(){

    }

    public void saveDistrict(District district){
        districtRepo.save(district);
    }
    public void saveDistricts(List<District> districts){
        districtRepo.saveAll(districts);
    }

    public List<District> getAllDistricts(){
        return districtRepo.findAll();
    }
}
