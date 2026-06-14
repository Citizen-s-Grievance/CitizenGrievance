package com.example.CitizenGrievance.repository;

import com.example.CitizenGrievance.entity.Counter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CounterRepo extends JpaRepository<Counter, Integer> {


}
