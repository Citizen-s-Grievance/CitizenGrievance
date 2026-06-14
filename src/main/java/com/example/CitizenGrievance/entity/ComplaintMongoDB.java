package com.example.CitizenGrievance.entity;

import jakarta.persistence.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "complaints")
public class ComplaintMongoDB {

    @Id
    @Field("_id")
    private Integer complaintId;  // ✅ Integer not int — forces as _id


    private byte[] audioComplaint;
    private byte[] userImage;
    private byte[] administrationImage;
    private byte[] pdfLLM;
    private String complaintDescriptionLLM;

    private LocalDateTime dateTime;

    public ComplaintMongoDB() {
    }

    public byte[] getAudioComplaint() {
        return audioComplaint;
    }

    public void setAudioComplaint(byte[] audioComplaint) {
        this.audioComplaint = audioComplaint;
    }



    // ✅ MUST return Integer not int
    public Integer getComplaintId() {  // Integer, not int
        return complaintId;
    }

    public void setComplaintId(Integer complaintId) {  // Integer, not int
        this.complaintId = complaintId;
    }

    public byte[] getUserImage() {
        return userImage;
    }

    public void setUserImage(byte[] userImage) {
        this.userImage = userImage;
    }

    public byte[] getAdministrationImage() {
        return administrationImage;
    }

    public void setAdministrationImage(byte[] administrationImage) {
        this.administrationImage = administrationImage;
    }

    public byte[] getPdfLLM() {
        return pdfLLM;
    }

    public void setPdfLLM(byte[] pdfLLM) {
        this.pdfLLM = pdfLLM;
    }

    public String getComplaintDescriptionLLM() {
        return complaintDescriptionLLM;
    }

    public void setComplaintDescriptionLLM(String complaintDescriptionLLM) {
        this.complaintDescriptionLLM = complaintDescriptionLLM;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }
}
