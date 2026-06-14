package com.example.CitizenGrievance.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DistrictStatsDTO {

    private String district;
    private long total;
    private long sent;
    private long inProgress;
    private long solved;

    public DistrictStatsDTO(String district,
                            long total,
                            long sent,
                            long inProgress,
                            long solved) {
        this.district    = district;
        this.total       = total;
        this.sent        = sent;
        this.inProgress  = inProgress;
        this.solved      = solved;
    }
}
