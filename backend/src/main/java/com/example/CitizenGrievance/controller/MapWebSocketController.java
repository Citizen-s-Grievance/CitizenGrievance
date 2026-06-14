package com.example.CitizenGrievance.controller;

import com.example.CitizenGrievance.dtos.ComplaintLocationDTO;
import com.example.CitizenGrievance.dtos.DistrictStatsDTO;
import com.example.CitizenGrievance.repository.ComplaintMYSQLRepo;
import com.example.CitizenGrievance.services.MapStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class MapWebSocketController {
    @Autowired private MapStatsService mapStatsService;
    @Autowired private ComplaintMYSQLRepo complaintMYSQLRepo;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/requestStats")
    @SendTo("/topic/mapStats")
    public List<DistrictStatsDTO> handleStatsRequest() {
        return mapStatsService.getAllDistrictStats();
    }

    // ✅ Push district stats every 10 seconds
    @Scheduled(fixedRate = 10000)
    public void pushStats() {
        messagingTemplate.convertAndSend(
                "/topic/mapStats",
                mapStatsService.getAllDistrictStats()
        );
    }

    // ✅ Push complaint dots every 15 seconds
    @Scheduled(fixedRate = 15000)
    public void pushComplaintLocations() {
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

        messagingTemplate.convertAndSend("/topic/complaints", locations);
    }
}
