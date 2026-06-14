package com.example.CitizenGrievance.dtos.responsedto;

import java.time.LocalDateTime;

public class ComplaintResponseByUser {
    private String complaintInWords;
    private String landmark;
    private String status;

    private String district;
    private String department;
    private LocalDateTime dateTime;
    private byte[] imageComplaint;
    private byte[] audioComplaint;
    private byte[] administrativeImageAfterResolving;
    private byte[] pdfLLM;

    public ComplaintResponseByUser() {
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public byte[] getPdfLLM() {
        return pdfLLM;
    }

    public void setPdfLLM(byte[] pdfLLM) {
        this.pdfLLM = pdfLLM;
    }

    public String getComplaintInWords() {
        return complaintInWords;
    }

    public void setComplaintInWords(String complaintInWords) {
        this.complaintInWords = complaintInWords;
    }

    public String getLandmark() {
        return landmark;
    }

    public void setLandmark(String landmark) {
        this.landmark = landmark;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public byte[] getImageComplaint() {
        return imageComplaint;
    }

    public void setImageComplaint(byte[] imageComplaint) {
        this.imageComplaint = imageComplaint;
    }

    public byte[] getAudioComplaint() {
        return audioComplaint;
    }

    public void setAudioComplaint(byte[] audioComplaint) {
        this.audioComplaint = audioComplaint;
    }

    public byte[] getAdministrativeImageAfterResolving() {
        return administrativeImageAfterResolving;
    }

    public void setAdministrativeImageAfterResolving(byte[] administrativeImageAfterResolving) {
        this.administrativeImageAfterResolving = administrativeImageAfterResolving;
    }
}
