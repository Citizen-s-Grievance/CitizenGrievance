package com.example.CitizenGrievance.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;

@Configuration
public class EmailConfig {

    @Bean
    public ScheduledThreadPoolExecutor schedulePool(){
      return new ScheduledThreadPoolExecutor(100);
    }
}
