package com.example.CitizenGrievance.services;

import com.example.CitizenGrievance.dtos.DistrictStatsDTO;
import com.example.CitizenGrievance.enums.Status;
import com.example.CitizenGrievance.repository.ComplaintMYSQLRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MapStatsService {

    @Autowired
    private ComplaintMYSQLRepo complaintMYSQLRepo;

    private static final List<String> DISTRICTS = List.of(
            "Adilabad","Kumuram Bheem Asifabad","Mancherial","Nirmal",
            "Nizamabad","Jagtial","Peddapalli","Kamareddy","Rajanna Sircilla",
            "Karimnagar","Jayashankar Bhupalpally","Sangareddy","Medak",
            "Siddipet","Jangaon","Hanumakonda","Warangal","Mulugu",
            "Bhadradri Kothagudem","Khammam","Mahabubabad","Suryapet",
            "Nalgonda","Yadadri Bhuvanagiri","Medchal Malkajgiri","Hyderabad",
            "Ranga Reddy","Vikarabad","Mahabubnagar","Narayanpet",
            "Jogulamba Gadwal","Wanaparthy","Nagarkurnool"
    );

    public List<DistrictStatsDTO> getAllDistrictStats() {
        return DISTRICTS.stream().map(district -> {
            long total      = complaintMYSQLRepo.countByDistrict(district);
            long sent       = complaintMYSQLRepo.countByDistrictAndStatus(
                    district, Status.SENT);
            long inProgress = complaintMYSQLRepo.countByDistrictAndStatus(
                    district, Status.IN_PROGRESS);
            long solved     = complaintMYSQLRepo.countByDistrictAndStatus(
                    district, Status.SOLVED);
            return new DistrictStatsDTO(district, total, sent, inProgress, solved);
        }).collect(Collectors.toList());
    }
}
