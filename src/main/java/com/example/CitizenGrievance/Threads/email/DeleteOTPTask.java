package com.example.CitizenGrievance.Threads.email;

import com.example.CitizenGrievance.repository.email.EmailOTPRepo;
import com.example.CitizenGrievance.services.email.EmailOTPService;
import com.example.CitizenGrievance.services.email.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


public class DeleteOTPTask implements Runnable {

    private final int id;
    private final EmailOTPRepo emailOTPRepo;

    public DeleteOTPTask(int id, EmailOTPRepo emailOTPRepo) {
        this.id = id;
        this.emailOTPRepo = emailOTPRepo;
    }

    @Override
    public void run() {
        emailOTPRepo.deleteById(id);
        System.out.println(" OTP deleted for id: " + id);
    }
}
