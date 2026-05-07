package com.kidfollow.backend.controller;

import com.kidfollow.backend.service.SensorFusionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 传感器数据 WebSocket 处理器
 * 处理前端连接并推送 kidfollow-core-lib 融合的传感器数据
 */
@Component
public class SensorWebSocketHandler extends TextWebSocketHandler {

    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    private final SensorFusionService sensorFusionService;
    private boolean isPushing = false;

    @Autowired
    public SensorWebSocketHandler(SensorFusionService sensorFusionService) {
        this.sensorFusionService = sensorFusionService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("WebSocket connected: " + session.getId());
        
        // 启动数据推送（仅首次连接时启动）
        if (!isPushing) {
            startDataPush();
            isPushing = true;
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 处理接收到的控制指令
        String payload = message.getPayload();
        System.out.println("Received command: " + payload);
        
        // 解析控制指令并转发到 kidfollow-core-lib
        try {
            // 这里可以添加控制指令解析逻辑
            // 例如：ControlCommand command = parseCommand(payload);
            // drivingModule.executeDecision(command);
        } catch (Exception e) {
            System.err.println("Failed to process command: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WebSocket disconnected: " + session.getId());
        
        // 如果没有连接了，停止推送
        if (sessions.isEmpty()) {
            isPushing = false;
        }
    }

    /**
     * 启动传感器数据推送
     * 从 kidfollow-core-lib 获取融合的传感器数据
     */
    private void startDataPush() {
        scheduler.scheduleAtFixedRate(() -> {
            if (sessions.isEmpty()) {
                return; // 没有连接时不推送数据
            }
            
            try {
                // 调用 kidfollow-core-lib 获取融合数据
                String sensorData = sensorFusionService.getFusedSensorDataJson();
                broadcast(sensorData);
            } catch (Exception e) {
                System.err.println("Failed to get sensor data: " + e.getMessage());
            }
        }, 0, 100, TimeUnit.MILLISECONDS); // 100ms 更新一次
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
}
