package com.example.CitizenGrievance.aop;

import com.example.CitizenGrievance.entity.Counter;
import com.example.CitizenGrievance.entity.District;
import com.example.CitizenGrievance.repository.CounterRepo;
import com.example.CitizenGrievance.services.DistrictServices;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Aspect
@Component
public class DistrictServicesAOP {
    @Autowired
    private DistrictServices districtServices;

    @Autowired
    private CounterRepo counterRepo;

    @Pointcut("execution(public * com.example.CitizenGrievance.services.DistrictServices.districtServiceAop())")
    public void p1(){

    }

    @After("p1()")
    public void saveDistrictRecords(){
       Counter counter=counterRepo.findById(1).orElse(null);
       int countValue=30;
       if(counter!=null){
           countValue=counter.getCount();
       }
       if(countValue<=1) {


           districtServices.saveDistricts(List.of(
                   new District(504001, "Adilabad"),
                   new District(504293, "Kumuram Bheem Asifabad"),
                   new District(504208, "Mancherial"),
                   new District(504106, "Nirmal"),
                   new District(503001, "Nizamabad"),
                   new District(505327, "Jagtial"),
                   new District(505172, "Peddapalli"),
                   new District(503111, "Kamareddy"),
                   new District(505301, "Rajanna Sircilla"),
                   new District(505001, "Karimnagar"),
                   new District(506169, "Jayashankar Bhupalpally"),
                   new District(502001, "Sangareddy"),
                   new District(502110, "Medak"),
                   new District(502103, "Siddipet"),
                   new District(506167, "Jangaon"),
                   new District(506001, "Hanumakonda"),
                   new District(506002, "Warangal"),
                   new District(506342, "Mulugu"),
                   new District(507101, "Bhadradri Kothagudem"),
                   new District(507001, "Khammam"),
                   new District(506101, "Mahabubabad"),
                   new District(508213, "Suryapet"),
                   new District(508001, "Nalgonda"),
                   new District(508116, "Yadadri Bhuvanagiri"),
                   new District(501401, "Medchal Malkajgiri"),
                   new District(500001, "Hyderabad"),
                   new District(501510, "Ranga Reddy"),
                   new District(501101, "Vikarabad"),
                   new District(509001, "Mahabubnagar"),
                   new District(509210, "Narayanpet"),
                   new District(509125, "Jogulamba Gadwal"),
                   new District(509103, "Wanaparthy"),
                   new District(509209, "Nagarkurnool")
           ));
           countValue++;
           counter.setCount(countValue);
           counterRepo.save(counter);


       }

    }

}
