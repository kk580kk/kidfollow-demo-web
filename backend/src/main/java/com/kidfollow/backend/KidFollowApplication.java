package com.kidfollow.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * KidFollow Demo Web Application
 * Spring Boot backend with WebSocket support
 */
@SpringBootApplication
public class KidFollowApplication {

    public static void main(String[] args) {
        SpringApplication.run(KidFollowApplication.class, args);
    }
}
