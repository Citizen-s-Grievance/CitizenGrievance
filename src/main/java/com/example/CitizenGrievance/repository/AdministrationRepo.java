package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.Administration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministrationRepo extends JpaRepository<Administration,String> {

    Optional<Administration> findByUsername(String username);
    Optional<Administration> findByEmail(String email);

    Administration getAdministrationByAdministrationId(String administrationId);
}
