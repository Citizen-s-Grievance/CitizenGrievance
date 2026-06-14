package com.example.CitizenGrievance.entity;

import com.example.CitizenGrievance.enums.Status;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class ComplaintMYSQL {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int complaintId;

    // 9 total digits, 6 after the decimal point
    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    // 10 total digits, 6 after the decimal point
    @Column(precision = 10, scale = 6)
    private BigDecimal longitude;

    private String complaintsInWords;
    private String landmark;

    @Enumerated(value=EnumType.STRING)
    @Column(name = "status", length = 20)
    private Status status;

    private String district;//these must be anlysied by frontend on the basis of longitude and latitude
    private String department;//Municipal problem

    private LocalDateTime dateTime;

    @ManyToOne
    @JoinColumn(name = "user_id_FK",referencedColumnName = "userId")
    private UserEntity userEntity;


    private int statusPriority;   // ✅ add this field
    public ComplaintMYSQL() {
    }

    public ComplaintMYSQL(BigDecimal latitude, BigDecimal longitude, String complaintsInWords, String landmark) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.complaintsInWords = complaintsInWords;
        this.landmark = landmark;
        this.status=Status.SENT;
    }
}
