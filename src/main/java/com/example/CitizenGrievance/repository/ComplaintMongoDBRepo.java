package com.example.CitizenGrievance.repository;


import com.example.CitizenGrievance.entity.ComplaintMongoDB;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintMongoDBRepo extends MongoRepository<ComplaintMongoDB,Integer> {
}
