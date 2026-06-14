package com.example.CitizenGrievance.aop;

import com.example.CitizenGrievance.entity.Counter;
import com.example.CitizenGrievance.entity.MunicipalProblems;
import com.example.CitizenGrievance.repository.CounterRepo;
import com.example.CitizenGrievance.services.MunicipalProblemsServices;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
public class MunicipalProblemsServicesAOP {
    @Autowired
   private MunicipalProblemsServices municipalProblemsServices;

    @Autowired
    private CounterRepo counterRepo;

    @Pointcut("execution(public * com.example.CitizenGrievance.services.MunicipalProblemsServices.MunicipalProblemsServiceAop())")
    public void p1(){

    }


    @After("p1()")
    public void saveMunicipalProblemsRecords(){
        Counter counter=counterRepo.findById(1).orElse(null);
        int countValue=30;
        if(counter!=null){
            countValue=counter.getCount();
        }
        if(countValue<=1) {
          municipalProblemsServices.saveMunicipalProblems(List.of(
                  new MunicipalProblems(1,"Electrical"),
                  new MunicipalProblems(2,"Water"),
                  new MunicipalProblems(3,"Sewage"),
                  new MunicipalProblems(4,"Road")
          ));


            countValue++;
            counter.setCount(countValue);
            counterRepo.save(counter);
        }
    }
}
