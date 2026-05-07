package com.kidfollow.backend.controller;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 传感器数据 WebSocket 处理器
 * 处理前端连接并推送传感器数据
 */
@Component
public class SensorWebSocketHandler extends TextWebSocketHandler {

    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("WebSocket connected: " + session.getId());
        
        // 启动数据推送
        startDataPush();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 处理接收到的控制指令
        System.out.println("Received command: " + message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WebSocket disconnected: " + session.getId());
    }

    /**
     * 启动传感器数据推送
     */
    private void startDataPush() {
        scheduler.scheduleAtFixedRate(() -> {
            String sensorData = generateMockSensorData();
            broadcast(sensorData);
        }, 0, 100, TimeUnit.MILLISECONDS); // 100ms 更新一次
    }

    /**
     * 生成模拟传感器数据
     * 实际项目中应调用 kidfollow-core-lib
     */
    private String generateMockSensorData() {
        try {
            // 模拟数据 - 实际应调用 kidfollow-core-lib 的 SensorData
            SensorDataDTO data = new SensorDataDTO(
                System.currentTimeMillis(),
                Math.random() * 10,           // distance
                Math.random() * 100,          // battery
                new double[180],              // laserScan ranges
                new double[8],                // ultrasonic
                Math.random() * 100,          // speed
                "FOLLOW"                      // mode
            );
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "{\"error\":\"data generation failed\"}";
        }
    }

    /**
     * 广播数据到所有客户端
     */
    private void broadcast(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    System.err.println("Failed to send message: " + e.getMessage());
                }
            }
        }
    }

    /**
     * 传感器数据 DTO
     */
    public static class SensorDataDTO {
        public long timestamp;
        public double distance;
        public double battery;
        public double[] laserScan;
        public double[] ultrasonic;
        public double speed;
        public String mode;

        public SensorDataDTO(long timestamp, double distance, double battery,
                           double[] laserScan, double[] ultrasonic, double speed, String mode) {
            this.timestamp = timestamp;
            this.distance = distance;
            this.battery = battery;
            this.laserScan = laserScan;
            this.ultrasonic = ultrasonic;
            this.speed = speed;
            this.mode = mode;
        }
    }
}
