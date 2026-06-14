package com.example.CitizenGrievance.services;


import com.example.CitizenGrievance.entity.Administration;
import com.example.CitizenGrievance.repository.AdministrationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("administrationService")
public class AdministrationService implements UserDetailsService {
    @Autowired
    private AdministrationRepo administrationRepository;

    //Joint point
    public void administrationServiceAop(){
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return administrationRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }

    public UserDetails save(Administration administration) {
        return administrationRepository.save(administration);
    }

//the below two methods for AOP
    public void saveAdministrations(List<Administration> administrations){
        administrationRepository.saveAll(administrations);
    }

    public List<Administration> getAllAdministrations(){
        return administrationRepository.findAll();
    }

}
