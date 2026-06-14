package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.dtos.ComplaintRequest;
import com.example.CitizenGrievance.dtos.responsedto.ComplaintResponseByUser;
import com.example.CitizenGrievance.dtos.responsedto.UserProfileResponse;
import com.example.CitizenGrievance.entity.ComplaintMYSQL;
import com.example.CitizenGrievance.entity.ComplaintMongoDB;
import com.example.CitizenGrievance.entity.UserEntity;
import com.example.CitizenGrievance.enums.Status;
import com.example.CitizenGrievance.repository.ComplaintMYSQLRepo;
import com.example.CitizenGrievance.repository.ComplaintMongoDBRepo;
import com.example.CitizenGrievance.repository.UserEntityRepo;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    @Autowired
    private ComplaintMYSQLRepo complaintMYSQLRepo;

    @Autowired
    private ComplaintMongoDBRepo  complaintMongoDBRepo;

    @Autowired private UserEntityRepo userEntityRepository;

    @Transactional
    public int fileComplaint(MultipartFile audioComplaint,
                             MultipartFile imageComplaint,
                             ComplaintRequest complaintRequest) throws IOException {

        // ✅ Validate files not empty
        if (audioComplaint.isEmpty()) {
            throw new RuntimeException("Audio complaint file is required!");
        }
        if (imageComplaint.isEmpty()) {
            throw new RuntimeException("Image complaint file is required!");
        }

        // ✅ Get logged-in username
        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        // ✅ Load user from DB
        UserEntity user = userEntityRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        LocalDateTime dateTime = LocalDateTime.now();

        // ✅ Save to MySQL first (to get complaintId)
        ComplaintMYSQL complaintMYSQL = new ComplaintMYSQL();
        complaintMYSQL.setLatitude(complaintRequest.getLatitude());
        complaintMYSQL.setLongitude(complaintRequest.getLongitude());
        complaintMYSQL.setComplaintsInWords(complaintRequest.getComplaintsInWords());
        complaintMYSQL.setLandmark(complaintRequest.getLandmark());
        complaintMYSQL.setStatus(Status.SENT);
        complaintMYSQL.setDistrict(complaintRequest.getDistrict());
        complaintMYSQL.setDepartment(complaintRequest.getDepartment());
        complaintMYSQL.setUserEntity(user);
        complaintMYSQL.setDateTime(dateTime);
        complaintMYSQL = complaintMYSQLRepo.save(complaintMYSQL);

        // ✅ Save to MongoDB with same complaintId
        ComplaintMongoDB complaintMongoDB = new ComplaintMongoDB();
        complaintMongoDB.setComplaintId(complaintMYSQL.getComplaintId());
        complaintMongoDB.setAudioComplaint(audioComplaint.getBytes());
        complaintMongoDB.setUserImage(imageComplaint.getBytes());
        complaintMongoDB.setDateTime(dateTime);
        complaintMongoDBRepo.save(complaintMongoDB);

        // ✅ Return complaintId — useful for frontend
        return complaintMYSQL.getComplaintId();
    }

    // ✅ Get all complaints of logged-in user
//    public synchronized List<ComplaintResponseByUser> getMyComplaints() {
//
//        String username = SecurityContextHolder
//                .getContext()
//                .getAuthentication()
//                .getName();
//
//        UserEntity user = userEntityRepository.findByUsername(username)
//                .orElseThrow(() -> new RuntimeException("User not found!"));
//
//        List<ComplaintMYSQL> complaints=user.getComplaintMYSQLS();
//        List<ComplaintResponseByUser> complaintResponses=new ArrayList<>();
//       for(ComplaintMYSQL complaintMYSQL:complaints){
//           ComplaintResponseByUser complaintResponseByUser=new ComplaintResponseByUser();
//           int complaintId=complaintMYSQL.getComplaintId();
//           complaintResponseByUser.setComplaintInWords(complaintMYSQL.getComplaintsInWords());
//           complaintResponseByUser.setLandmark(complaintMYSQL.getLandmark());
//           complaintResponseByUser.setStatus(complaintMYSQL.getStatus().toString());
//           complaintResponseByUser.setDistrict(complaintMYSQL.getDistrict());
//           complaintResponseByUser.setDateTime(complaintMYSQL.getDateTime());
//           ComplaintMongoDB complaintMongoDB=complaintMongoDBRepo.findById(complaintId).orElse(null);
//           if(complaintMongoDB!=null){
//               complaintResponseByUser.setAudioComplaint(complaintMongoDB.getAudioComplaint());
//               complaintResponseByUser.setImageComplaint(complaintMongoDB.getUserImage());
//               complaintResponseByUser.setPdfLLM(complaintMongoDB.getPdfLLM());
//               if(complaintMYSQL.getStatus().toString().equals("SOLVED")){
//                   complaintResponseByUser.setAdministrativeImageAfterResolving(complaintMongoDB.getAdministrationImage());
//               }
//           }
//
//           complaintResponses.add(complaintResponseByUser);
//       }
//        return complaintResponses;
//    }

    @Transactional
    public Map<String, Object> getMyComplaints(int page, int size,
                                               String sortBy, String sortOrder) {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        UserEntity user = userEntityRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // ✅ Validate sortBy field — prevent SQL injection
        List<String> allowedSortFields = List.of(
                "dateTime",    // sort by date
                "status",      // sort by status
                "district",    // sort by district
                "department"   // sort by department/category
        );

        if (!allowedSortFields.contains(sortBy)) {
            throw new RuntimeException(
                    "Invalid sort field! Allowed: " + allowedSortFields
            );
        }

        // ✅ Build sort direction
        Sort sort = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        // ✅ Create pageable with sort
        Pageable pageable = PageRequest.of(page, size, sort);

        // ✅ Fetch from MySQL
        Page<ComplaintMYSQL> complaintPage =
                complaintMYSQLRepo.findByUserEntity(user, pageable);

        List<ComplaintMYSQL> complaints = complaintPage.getContent();

        if (complaints.isEmpty()) {
            return buildPageResponse(new ArrayList<>(), complaintPage);
        }

        // ✅ Fetch MongoDB in one query
        List<Integer> complaintIds = complaints.stream()
                .map(ComplaintMYSQL::getComplaintId)
                .collect(Collectors.toList());

        Map<Integer, ComplaintMongoDB> mongoMap = complaintMongoDBRepo
                .findAllById(complaintIds)
                .stream()
                .collect(Collectors.toMap(
                        ComplaintMongoDB::getComplaintId,
                        c -> c
                ));

        // ✅ Build response — same order as sorted MySQL result
        List<ComplaintResponseByUser> complaintResponses = new ArrayList<>();

        for (ComplaintMYSQL complaintMYSQL : complaints) {

            ComplaintResponseByUser response = new ComplaintResponseByUser();
            response.setComplaintInWords(complaintMYSQL.getComplaintsInWords());
            response.setLandmark(complaintMYSQL.getLandmark());
            response.setStatus(complaintMYSQL.getStatus().toString());
            response.setDistrict(complaintMYSQL.getDistrict());
            response.setDepartment(complaintMYSQL.getDepartment());    // ✅ add department
            response.setDateTime(complaintMYSQL.getDateTime());

            ComplaintMongoDB mongoData = mongoMap.get(complaintMYSQL.getComplaintId());

            if (mongoData != null) {
                response.setAudioComplaint(mongoData.getAudioComplaint());
                response.setImageComplaint(mongoData.getUserImage());
                response.setPdfLLM(mongoData.getPdfLLM());

                if (Status.SOLVED.equals(complaintMYSQL.getStatus())) {
                    response.setAdministrativeImageAfterResolving(
                            mongoData.getAdministrationImage()
                    );
                }
            }
            complaintResponses.add(response);
        }

        return buildPageResponse(complaintResponses, complaintPage, sortBy, sortOrder);
    }

    // ✅ Updated helper — includes sort info
    private Map<String, Object> buildPageResponse(
            List<ComplaintResponseByUser> complaints,
            Page<ComplaintMYSQL> page,
            String sortBy,
            String sortOrder) {

        Map<String, Object> response = new HashMap<>();
        response.put("complaints",      complaints);
        response.put("currentPage",     page.getNumber());
        response.put("totalComplaints", page.getTotalElements());
        response.put("totalPages",      page.getTotalPages());
        response.put("isLastPage",      page.isLast());
        response.put("isFirstPage",     page.isFirst());
        response.put("pageSize",        page.getSize());
        response.put("sortBy",          sortBy);      // ✅ show what sorted by
        response.put("sortOrder",       sortOrder);   // ✅ show asc or desc
        return response;
    }

    // ✅ Overloaded for empty response
    private Map<String, Object> buildPageResponse(
            List<ComplaintResponseByUser> complaints,
            Page<ComplaintMYSQL> page) {
        return buildPageResponse(complaints, page, "dateTime", "desc");
    }

    // ✅ Add this method in ComplaintService
    @Transactional
    public Map<String, Long> getMyComplaintStats() {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        UserEntity user = userEntityRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        long total      = complaintMYSQLRepo.countByUserEntity(user);
        long sent       = complaintMYSQLRepo.countByUserEntityAndStatus(user, Status.SENT);
        long inProgress = complaintMYSQLRepo.countByUserEntityAndStatus(user, Status.IN_PROGRESS);
        long solved     = complaintMYSQLRepo.countByUserEntityAndStatus(user, Status.SOLVED);

        Map<String, Long> stats = new HashMap<>();
        stats.put("total",      total);
        stats.put("sent",       sent);
        stats.put("inProgress", inProgress);
        stats.put("solved",     solved);
        return stats;
    }

    // Inside your ComplaintService class

    public UserProfileResponse getProfileDetails() {
        // ✅ Extract logged-in username securely from security context
        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        // ✅ Fetch user details from DB
        UserEntity user = userEntityRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User profile not found!"));

        // ✅ Map Entity data to DTO (Excluding userId)
        UserProfileResponse profile = new UserProfileResponse();
        profile.setName(user.getName());
        profile.setUsername(user.getUsername());
        profile.setRole(user.getRole());
        profile.setAadharNumber(user.getAadharNumber());
        profile.setPhoneNumber(user.getPhoneNumber());
        profile.setEmail(user.getEmail());
        profile.setAddress(user.getAddress());
        profile.setDistrict(user.getDistrict());
        profile.setState(user.getState());
        profile.setPinCode(user.getPinCode());

        return profile;
    }

}
