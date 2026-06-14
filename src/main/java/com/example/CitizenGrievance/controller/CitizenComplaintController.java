package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.dtos.ComplaintRequest;
import com.example.CitizenGrievance.dtos.responsedto.UserProfileResponse;
import com.example.CitizenGrievance.services.ComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
@CrossOrigin(origins = "http://localhost:5173/")
@RestController
@RequestMapping("/citizen")          // ✅ moved complaint endpoints here
public class CitizenComplaintController {   // ✅ separate controller for complaints

    @Autowired
    private ComplaintService complaintService;

    // ✅ File a complaint
    @PostMapping("/complaint")
    public ResponseEntity fileComplaint(
            @RequestParam("audio-complaint") MultipartFile audioComplaint,
            @RequestParam("image-complaint") MultipartFile imageComplaint,
            @RequestParam("latitude") BigDecimal latitude,
            @RequestParam("longitude") BigDecimal longitude,
            @RequestParam("complaintsInWords") String complaintsInWords,
            @RequestParam("landmark") String landmark,
            @RequestParam("district") String district,
            @RequestParam("department") String department) {
        try {
            // ✅ Build request object
            ComplaintRequest complaintRequest = new ComplaintRequest();
            complaintRequest.setLatitude(latitude);
            complaintRequest.setLongitude(longitude);
            complaintRequest.setComplaintsInWords(complaintsInWords);
            complaintRequest.setLandmark(landmark);
            complaintRequest.setDistrict(district);
            complaintRequest.setDepartment(department);

            int result = complaintService.fileComplaint(
                    audioComplaint, imageComplaint, complaintRequest
            );
            return new ResponseEntity<>("Complaint filed successfully!", HttpStatus.OK);

        } catch (IOException e) {
            return new ResponseEntity<>(
                    "File upload failed: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ✅ Get my complaints
    @GetMapping("/getMyComplaints")
    public ResponseEntity getMyComplaints(
            @RequestParam(defaultValue = "0")          int page,
            @RequestParam(defaultValue = "10")         int size,
            @RequestParam(defaultValue = "dateTime")   String sortBy,    // ✅ sort field
            @RequestParam(defaultValue = "desc")       String sortOrder) { // ✅ asc or desc
        try {
            return new ResponseEntity<>(
                    complaintService.getMyComplaints(page, size, sortBy, sortOrder),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ✅ NEW — Get my complaint stats
    @GetMapping("/myStats")
    public ResponseEntity getMyStats() {
        try {
            return new ResponseEntity<>(
                    complaintService.getMyComplaintStats(),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // Inside your CitizenComplaintController class

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        UserProfileResponse profile = complaintService.getProfileDetails();
        return ResponseEntity.ok(profile);
    }




}