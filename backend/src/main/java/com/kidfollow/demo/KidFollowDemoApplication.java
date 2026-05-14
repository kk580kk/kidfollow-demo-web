package com.kidfollow.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * KidFollow Demo Web Application
 * 集成 React 前端 + Spring Boot 后端 + kidfollow-core-lib 核心算法库
 */
@SpringBootApplication
@EnableScheduling
public class KidFollowDemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(KidFollowDemoApplication.class, args);
    }
}