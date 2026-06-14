package com.example.CitizenGrievance.aop;

import com.example.CitizenGrievance.entity.Administration;
import com.example.CitizenGrievance.entity.District;
import com.example.CitizenGrievance.entity.MunicipalProblems;
import com.example.CitizenGrievance.services.AdministrationService;
import com.example.CitizenGrievance.services.DistrictServices;
import com.example.CitizenGrievance.services.MunicipalProblemsServices;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
public class AdministrationServiceAOP {
    @Autowired
    private AdministrationService administrationService;

    @Autowired
    private DistrictServices districtServices;

    @Autowired
    private MunicipalProblemsServices municipalProblemsServices;

    @Pointcut("execution(public * com.example.CitizenGrievance.services.AdministrationService.administrationServiceAop())")
    public void p1(){

    }

    @After("p1()")
    public void saveAdministrationRecords(){
        List<Administration> ls=administrationService.getAllAdministrations();

        if(ls.size()==0){
            List<District> districts=districtServices.getAllDistricts();
            List<MunicipalProblems> municipalProblems=municipalProblemsServices.getAllMunicipalProblems();
            int districtId=0;
            int municipalProblemsId=0;
            for(int i=0;i<districts.size();i++){
                districtId=districts.get(i).getDistrictId();
                for (int j = 0; j <municipalProblems.size() ; j++) {
                   municipalProblemsId=municipalProblems.get(j).getMunicipalProblemId();
                   Administration administration=new Administration();
                   String administrationId=districtId+""+municipalProblemsId;
                   administration.setAdministrationId(administrationId);
                   ls.add(administration);

                }
            }

            administrationService.saveAdministrations(ls);
        }

    }
}
