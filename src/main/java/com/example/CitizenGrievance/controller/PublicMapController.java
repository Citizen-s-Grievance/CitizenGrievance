package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.dtos.ComplaintLocationDTO;
import com.example.CitizenGrievance.dtos.DistrictStatsDTO;
import com.example.CitizenGrievance.repository.ComplaintMYSQLRepo;
import com.example.CitizenGrievance.services.MapStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public")
@CrossOrigin(origins = "http://localhost:5173/")
public class PublicMapController {

    @Autowired
    private MapStatsService mapStatsService;
    @Autowired private ComplaintMYSQLRepo complaintMYSQLRepo;

    // ✅ No auth needed — public endpoint
    @GetMapping("/mapStats")
    public ResponseEntity<List<DistrictStatsDTO>> getMapStats() {
        return ResponseEntity.ok(mapStatsService.getAllDistrictStats());
    }

    // ✅ NEW — complaint dot locations
    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintLocationDTO>> getComplaintLocations() {
        List<ComplaintLocationDTO> locations = complaintMYSQLRepo
                .findAllWithCoordinates()
                .stream()
                .map(c -> new ComplaintLocationDTO(
                        c.getComplaintId(),
                        c.getLatitude().doubleValue(),
                        c.getLongitude().doubleValue(),
                        c.getStatus().name(),
                        c.getDistrict(),
                        c.getDepartment()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(locations);
    }
}