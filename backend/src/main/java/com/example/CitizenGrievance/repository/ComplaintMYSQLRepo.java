package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.ComplaintMYSQL;
import com.example.CitizenGrievance.entity.UserEntity;
import com.example.CitizenGrievance.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintMYSQLRepo extends JpaRepository<ComplaintMYSQL,Integer> {
    Page<ComplaintMYSQL> findByUserEntity(UserEntity userEntity, Pageable pageable);

    // ✅ Find complaints by district + department with pagination
    Page<ComplaintMYSQL> findByDistrictAndDepartment(
            String district, String department, Pageable pageable
    );

    // ✅ Count by user and status
    long countByUserEntity(UserEntity userEntity);
    long countByUserEntityAndStatus(UserEntity userEntity, Status status);

    // ✅ Count by district and status
    long countByDistrict(String district);
    long countByDistrictAndStatus(String district, Status status);

    // ✅ Get all complaints with GPS coordinates
    @Query("SELECT c FROM ComplaintMYSQL c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
    List<ComplaintMYSQL> findAllWithCoordinates();
    // ✅ Add these
    long countByDistrictAndDepartment(String district, String department);
    long countByDistrictAndDepartmentAndStatus(String district, String department, Status status);
}

