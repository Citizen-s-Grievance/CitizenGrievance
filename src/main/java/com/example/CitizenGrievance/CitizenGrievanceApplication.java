package com.example.CitizenGrievance;

import com.example.CitizenGrievance.entity.Administration;
import com.example.CitizenGrievance.entity.Counter;
import com.example.CitizenGrievance.repository.CounterRepo;
import com.example.CitizenGrievance.repository.MunicipalProblemsRepo;
import com.example.CitizenGrievance.services.AdministrationService;
import com.example.CitizenGrievance.services.DistrictServices;
import com.example.CitizenGrievance.services.MunicipalProblemsServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;

@SpringBootApplication
@EnableScheduling
@EnableAspectJAutoProxy//this will enable ASPECT ORIENTATION
public class CitizenGrievanceApplication implements CommandLineRunner {

    @Autowired
	CounterRepo counterRepo;

    @Autowired
	DistrictServices districtServices;

    @Autowired
	AdministrationService administrationService;

    @Autowired
	MunicipalProblemsServices municipalProblemsServices;
	public static void main(String[] args) {

		SpringApplication.run(CitizenGrievanceApplication.class, args);

	}

	@Override
	public void run(String... args) throws Exception {
		List<Counter> ls=counterRepo.findAll();
		if(ls.size()==0){
			Counter counter=new Counter();
			counter.setCount(0);
			counterRepo.save(counter);
		}
		districtServices.districtServiceAop();
		municipalProblemsServices.MunicipalProblemsServiceAop();
        administrationService.administrationServiceAop();
	}
}
