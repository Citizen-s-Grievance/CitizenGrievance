package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.entity.MunicipalProblems;
import com.example.CitizenGrievance.repository.MunicipalProblemsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MunicipalProblemsServices {
    @Autowired
    MunicipalProblemsRepo municipalProblemsRepo;
    // joint point
    public void MunicipalProblemsServiceAop(){

    }

    public void saveMunicipalProblem(MunicipalProblems m) {
        municipalProblemsRepo.save(m);
    }

    public void saveMunicipalProblems(List<MunicipalProblems> m) {
        municipalProblemsRepo.saveAll(m);
    }

    public List<MunicipalProblems> getAllMunicipalProblems(){
        return municipalProblemsRepo.findAll();
    }
}
