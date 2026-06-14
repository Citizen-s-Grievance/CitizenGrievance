package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.services.AdministrationComplaintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
@CrossOrigin(origins = "http://localhost:5173/")
@RestController
@RequestMapping("/admin")
public class AdministratorComplaintController {
    @Autowired
    private AdministrationComplaintService adminComplaintService;

    // ── View complaints ──────────────────────────────────────────
    @GetMapping("/complaints")
    public ResponseEntity getComplaints(
            @RequestParam(defaultValue = "0")        int page,
            @RequestParam(defaultValue = "10")       int size,
            @RequestParam(defaultValue = "dateTime") String sortBy,
            @RequestParam(defaultValue = "desc")     String sortOrder) {
        try {
            return new ResponseEntity<>(
                    adminComplaintService.getComplaints(page, size, sortBy, sortOrder),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ── Update status + image (combined) ────────────────────────
    @PutMapping("/complaint/resolve/{complaintId}")
    public ResponseEntity resolveComplaint(
            @PathVariable Integer complaintId,
            @RequestParam("status") String status,
            // ✅ Image is optional — not required
            @RequestParam(value = "repaired-image", required = false)
            MultipartFile repairedImage) {
        try {
            return new ResponseEntity<>(
                    adminComplaintService.resolveComplaint(
                            complaintId, status, repairedImage
                    ),
                    HttpStatus.OK
            );
        } catch (IOException e) {
            return new ResponseEntity<>(
                    "Image upload failed: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST
            );
        } catch (RuntimeException e) {
            return new ResponseEntity<>(
                    e.getMessage(), HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ── View Profile ─────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            return new ResponseEntity<>(
                    adminComplaintService.getAdminProfile(),
                    HttpStatus.OK
            );
        } catch (RuntimeException e) {
            return new ResponseEntity<>(
                    e.getMessage(), HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ✅ NEW — Admin stats (same district+department filter)
    @GetMapping("/myStats")
    public ResponseEntity getMyStats() {
        try {
            return new ResponseEntity<>(
                    adminComplaintService.getAdminComplaintStats(),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            return new ResponseEntity<>(
                    e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
