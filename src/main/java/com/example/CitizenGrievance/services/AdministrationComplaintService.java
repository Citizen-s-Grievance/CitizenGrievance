package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.dtos.responsedto.AdministrationProfileResponse;
import com.example.CitizenGrievance.dtos.responsedto.ComplaintResponseByAdmin;
import com.example.CitizenGrievance.entity.Administration;
import com.example.CitizenGrievance.entity.ComplaintMYSQL;
import com.example.CitizenGrievance.entity.ComplaintMongoDB;
import com.example.CitizenGrievance.enums.Status;
import com.example.CitizenGrievance.repository.AdministrationRepo;
import com.example.CitizenGrievance.repository.ComplaintMYSQLRepo;
import com.example.CitizenGrievance.repository.ComplaintMongoDBRepo;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;

import static com.example.CitizenGrievance.enums.Status.*;

@Service
public class AdministrationComplaintService {

    @Autowired private ComplaintMYSQLRepo complaintMYSQLRepo;
    @Autowired private ComplaintMongoDBRepo complaintMongoDBRepo;

    @Autowired
    private AdministrationRepo administrationRepository;
    @Autowired private MongoTemplate mongoTemplate;

    // ── Get complaints ───────────────────────────────────────────
    public Map<String, Object> getComplaints(int page, int size,
                                             String sortBy, String sortOrder) {

        String username = SecurityContextHolder
                .getContext().getAuthentication().getName();

        Administration admin = administrationRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));

        List<String> allowedSortFields = List.of(
                "dateTime", "statusPriority", "district", "department"
        );
        if (!allowedSortFields.contains(sortBy)) {
            throw new RuntimeException(
                    "Invalid sort field! Allowed: " + allowedSortFields
            );
        }

        Sort sort = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ComplaintMYSQL> complaintPage =
                complaintMYSQLRepo.findByDistrictAndDepartment(
                        admin.getDistrict(), admin.getDepartment(), pageable
                );

        List<ComplaintMYSQL> complaints = complaintPage.getContent();

        if (complaints.isEmpty()) {
            return buildPageResponse(new ArrayList<>(), complaintPage,
                    sortBy, sortOrder);
        }

        List<Integer> complaintIds = complaints.stream()
                .map(ComplaintMYSQL::getComplaintId)
                .collect(Collectors.toList());

        Map<Integer, ComplaintMongoDB> mongoMap = complaintMongoDBRepo
                .findAllById(complaintIds).stream()
                .collect(Collectors.toMap(
                        ComplaintMongoDB::getComplaintId, c -> c
                ));

        List<ComplaintResponseByAdmin> responses = new ArrayList<>();

        for (ComplaintMYSQL complaint : complaints) {
            ComplaintResponseByAdmin response = buildResponse(
                    complaint, mongoMap.get(complaint.getComplaintId())
            );
            responses.add(response);
        }

        return buildPageResponse(responses, complaintPage, sortBy, sortOrder);
    }

    // ── Combined Update Status + Image ───────────────────────────
    @Transactional
    public String resolveComplaint(Integer complaintId,
                                   String newStatus,
                                   MultipartFile repairedImage) throws IOException {

        String username = SecurityContextHolder
                .getContext().getAuthentication().getName();

        Administration admin = administrationRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));

        // ✅ Find complaint
        ComplaintMYSQL complaint = complaintMYSQLRepo
                .findById(complaintId)
                .orElseThrow(() -> new RuntimeException(
                        "Complaint not found: " + complaintId
                ));

        // ✅ Verify belongs to admin
        if (!complaint.getDistrict().equals(admin.getDistrict()) ||
                !complaint.getDepartment().equals(admin.getDepartment())) {
            throw new RuntimeException(
                    "Unauthorized! Complaint does not belong to your district/department!"
            );
        }

        // ✅ Validate and update status
        try {
            Status status = Status.valueOf(newStatus);
            complaint.setStatus(status);
            switch (status) {
                case SENT        -> complaint.setStatusPriority(1);
                case IN_PROGRESS -> complaint.setStatusPriority(2);
                case SOLVED      -> complaint.setStatusPriority(3);
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                    "Invalid status! Allowed: SENT, IN_PROGRESS, SOLVED"
            );
        }

        // ✅ Update image if provided
        String imageMessage = "";
//        if (repairedImage != null && !repairedImage.isEmpty()) {
//            ComplaintMongoDB mongoData = complaintMongoDBRepo
//                    .findById(complaintId)
//                    .orElseThrow(() -> new RuntimeException(
//                            "Complaint media not found!"
//                    ));
//            System.out.println("MongoDB ID before save: " + mongoData.getComplaintId());
//            System.out.println("MongoDB ID class: " + ((Object)mongoData.getComplaintId()).getClass().getName());
//            mongoData.setAdministrationImage(repairedImage.getBytes());
//            complaintMongoDBRepo.save(mongoData);
//            imageMessage = " + Image uploaded";
//        }

        if (repairedImage != null && !repairedImage.isEmpty()) {

            Query query = new Query(
                    Criteria.where("_id").is(complaintId)
            );

            Update update = new Update()
                    .set("administrationImage", repairedImage.getBytes());

            long matched = mongoTemplate
                    .updateFirst(query, update, ComplaintMongoDB.class)
                    .getMatchedCount();

            if (matched == 0) {
                throw new RuntimeException("Complaint media not found in MongoDB!");
            }

            imageMessage = " + Image uploaded";
        }

        complaintMYSQLRepo.save(complaint);

        return "Status updated to: " + newStatus + imageMessage;
    }

    // ── Helper: Build single response ────────────────────────────
    private ComplaintResponseByAdmin buildResponse(ComplaintMYSQL complaint,
                                                   ComplaintMongoDB mongoData) {
        ComplaintResponseByAdmin response = new ComplaintResponseByAdmin();
        response.setComplaintId(complaint.getComplaintId());
        response.setComplaintInWords(complaint.getComplaintsInWords());
        response.setLandmark(complaint.getLandmark());
        response.setStatus(complaint.getStatus().toString());
        response.setDistrict(complaint.getDistrict());
        response.setDepartment(complaint.getDepartment());
        response.setDateTime(complaint.getDateTime());
        response.setLatitude(complaint.getLatitude());
        response.setLongitude(complaint.getLongitude());

        if (complaint.getUserEntity() != null) {
            response.setUserName(complaint.getUserEntity().getName());
            response.setUserPhone(complaint.getUserEntity().getPhoneNumber());
        }

        if (mongoData != null) {
            response.setUserImage(mongoData.getUserImage());
            response.setAudioComplaint(mongoData.getAudioComplaint());
            response.setPdfLLM(mongoData.getPdfLLM());
            response.setComplaintDescriptionLLM(
                    mongoData.getComplaintDescriptionLLM()
            );
            // ✅ Set admin image — flag auto set inside setter
            response.setAdministrationImage(mongoData.getAdministrationImage());
        }

        return response;
    }

    // ── Helper: Build page response ──────────────────────────────
    private Map<String, Object> buildPageResponse(
            List<ComplaintResponseByAdmin> complaints,
            Page<ComplaintMYSQL> page,
            String sortBy, String sortOrder) {

        Map<String, Object> response = new HashMap<>();
        response.put("complaints",      complaints);
        response.put("currentPage",     page.getNumber());
        response.put("totalComplaints", page.getTotalElements());
        response.put("totalPages",      page.getTotalPages());
        response.put("isLastPage",      page.isLast());
        response.put("isFirstPage",     page.isFirst());
        response.put("pageSize",        page.getSize());
        response.put("sortBy",          sortBy);
        response.put("sortOrder",       sortOrder);
        return response;
    }

    // ── Fetch Profile Details ────────────────────────────────────
    public AdministrationProfileResponse getAdminProfile() {
        String username = SecurityContextHolder
                .getContext().getAuthentication().getName();

        Administration admin = administrationRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));

        return buildProfileResponse(admin);
    }

    // ── Helper: Map Entity to DTO ────────────────────────────────
    private AdministrationProfileResponse buildProfileResponse(Administration admin) {
        AdministrationProfileResponse dto = new AdministrationProfileResponse();
        dto.setAdministrationId(admin.getAdministrationId());
        dto.setUsername(admin.getUsername());
        dto.setEmail(admin.getEmail());
        dto.setName(admin.getName());
        dto.setPhoneNumber(admin.getPhoneNumber());
        dto.setDistrict(admin.getDistrict());
        dto.setDepartment(admin.getDepartment());
        return dto;
    }

    @Transactional
    public Map<String, Long> getAdminComplaintStats() {

        // ✅ Get logged-in admin
        String username = SecurityContextHolder
                .getContext().getAuthentication().getName();

        Administration admin = administrationRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found!"));

        // ✅ Filter by admin's district + department (same as getComplaints)
        long total      = complaintMYSQLRepo
                .countByDistrictAndDepartment(
                        admin.getDistrict(), admin.getDepartment());
        long sent       = complaintMYSQLRepo
                .countByDistrictAndDepartmentAndStatus(
                        admin.getDistrict(), admin.getDepartment(), Status.SENT);
        long inProgress = complaintMYSQLRepo
                .countByDistrictAndDepartmentAndStatus(
                        admin.getDistrict(), admin.getDepartment(), Status.IN_PROGRESS);
        long solved     = complaintMYSQLRepo
                .countByDistrictAndDepartmentAndStatus(
                        admin.getDistrict(), admin.getDepartment(), Status.SOLVED);

        Map<String, Long> stats = new HashMap<>();
        stats.put("total",      total);
        stats.put("sent",       sent);
        stats.put("inProgress", inProgress);
        stats.put("solved",     solved);
        return stats;
    }
}