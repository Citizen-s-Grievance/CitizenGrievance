package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DistrictRepo extends JpaRepository<District, Integer> {
    Optional<District> findByDistrictName(String districtName);
    //  int findDistrictByDistrictName(String districtName);
}
