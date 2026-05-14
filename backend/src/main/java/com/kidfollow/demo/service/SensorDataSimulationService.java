package com.kidfollow.demo.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.Random;

/**
 * 传感器数据模拟服务 - 定时推送模拟数据到前端
 */
@Service
@EnableScheduling
public class SensorDataSimulationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Random random = new Random();

    /**
     * 每100ms发送一次传感器数据
     */
    @Scheduled(fixedRate = 100)
    public void sendSensorData() {
        Map<String, Object> sensorData = Map.of(
            "sensorData", Map.of(
                "timestamp", System.currentTimeMillis(),
                "battery", 85 - random.nextInt(5),
                "gps", Map.of("lat", 39.9042 + random.nextDouble() * 0.001, "lng", 116.4074 + random.nextDouble() * 0.001),
                "laserScan", Map.of(
                    "ranges", new double[]{2.0 + Math.sin(System.currentTimeMillis() / 1000.0) * 0.5, 3.5, 5.0, 8.0},
                    "angles", new int[]{0, -30, 30, -60},
                    "obstacleDetected", random.nextDouble() > 0.7
                ),
                "ultrasonicRadar", Map.of(
                    "frontLeft", 25 + random.nextInt(10),
                    "frontRight", 30 + random.nextInt(10),
                    "frontTop", 20 + random.nextInt(10),
                    "frontBottom", 18 + random.nextInt(10),
                    "rearLeft", 45 + random.nextInt(10),
                    "rearRight", 40 + random.nextInt(10),
                    "rearTop", 35 + random.nextInt(10),
                    "rearBottom", 38 + random.nextInt(10)
                ),
                "visualTarget", Map.of(
                    "type", "child",
                    "confidence", 0.92 + random.nextDouble() * 0.08,
                    "position", Map.of("x", Math.sin(System.currentTimeMillis() / 2000.0) * 0.5, "y", 2.0 + Math.cos(System.currentTimeMillis() / 2000.0) * 0.3)
                ),
                "childPresent", true,
                "fenceStatus", "SAFE"
            )
        );

        messagingTemplate.convertAndSend("/topic/sensor", sensorData);
    }

    /**
     * 每500ms发送一次车辆状态
     */
    @Scheduled(fixedRate = 500)
    public void sendVehicleState() {
        Map<String, Object> vehicleState = Map.of(
            "position", new double[]{0, 0, 0},
            "rotation", new double[]{0, Math.sin(System.currentTimeMillis() / 3000.0) * 0.2, 0},
            "speed", 3 + random.nextInt(2),
            "mode", random.nextDouble() > 0.7 ? "AVOID" : "FOLLOW",
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/topic/vehicle", vehicleState);
    }

    /**
     * 每300ms发送一次目标状态
     */
    @Scheduled(fixedRate = 300)
    public void sendTargetState() {
        double angle = System.currentTimeMillis() / 2000.0;
        Map<String, Object> targetState = Map.of(
            "position", new double[]{Math.sin(angle) * 2, 0, Math.cos(angle) * 2 + 2},
            "detected", true,
            "confidence", 0.92 + random.nextDouble() * 0.08,
            "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/topic/target", targetState);
    }
}
