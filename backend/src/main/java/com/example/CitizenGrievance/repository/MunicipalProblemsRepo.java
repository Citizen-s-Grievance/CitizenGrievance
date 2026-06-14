package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.MunicipalProblems;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MunicipalProblemsRepo extends JpaRepository<MunicipalProblems, Integer> {
    int getMunicipalProblemsByMunicipalProblemName(String municipalProblemName);

    // ✅ Repository — return full object
    Optional<MunicipalProblems> findByMunicipalProblemName(String name);
   // Optional<MunicipalProblems> findMunicipalProblemsByMunicipalProblemName(String municipalProblemName);
}
