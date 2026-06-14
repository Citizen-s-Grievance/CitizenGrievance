package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserEntityRepo extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByAadharNumber(String aadharNumber);
    boolean existsByPhoneNumber(String phoneNumber);
}
