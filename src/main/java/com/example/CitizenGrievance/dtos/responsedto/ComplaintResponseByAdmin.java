package com.example.CitizenGrievance.dtos.responsedto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ComplaintResponseByAdmin {

    private int complaintId;
    private String complaintInWords;
    private String landmark;
    private String status;
    private String district;
    private String department;
    private LocalDateTime dateTime;

    // user details
    private String userName;
    private String userPhone;

    // location
    private BigDecimal latitude;
    private BigDecimal longitude;

    // media from MongoDB
    private byte[] userImage;
    private byte[] audioComplaint;
    private byte[] pdfLLM;
    private String complaintDescriptionLLM;

    // ✅ Admin image — frontend checks if null → show "Upload Image" button
    private byte[] administrationImage;

    // ✅ Helper flag — frontend uses this directly
    private boolean isImageUploaded;

    // getters and setters
    public int getComplaintId() { return complaintId; }
    public void setComplaintId(int complaintId) { this.complaintId = complaintId; }
    public String getComplaintInWords() { return complaintInWords; }
    public void setComplaintInWords(String v) { this.complaintInWords = v; }
    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public LocalDateTime getDateTime() { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserPhone() { return userPhone; }
    public void setUserPhone(String userPhone) { this.userPhone = userPhone; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public byte[] getUserImage() { return userImage; }
    public void setUserImage(byte[] userImage) { this.userImage = userImage; }
    public byte[] getAudioComplaint() { return audioComplaint; }
    public void setAudioComplaint(byte[] v) { this.audioComplaint = v; }
    public byte[] getPdfLLM() { return pdfLLM; }
    public void setPdfLLM(byte[] pdfLLM) { this.pdfLLM = pdfLLM; }
    public String getComplaintDescriptionLLM() { return complaintDescriptionLLM; }
    public void setComplaintDescriptionLLM(String v) { this.complaintDescriptionLLM = v; }

    // ✅ Admin image
    public byte[] getAdministrationImage() { return administrationImage; }
    public void setAdministrationImage(byte[] administrationImage) {
        this.administrationImage = administrationImage;
        // ✅ Auto set flag when image is set
        this.isImageUploaded = administrationImage != null
                && administrationImage.length > 0;
    }

    // ✅ Flag
    public boolean isImageUploaded() { return isImageUploaded; }
}