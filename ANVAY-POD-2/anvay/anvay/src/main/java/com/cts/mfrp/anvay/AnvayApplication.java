package com.cts.mfrp.anvay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AnvayApplication {

	public static void main(String[] args) {
		SpringApplication.run(AnvayApplication.class, args);
	}

}
