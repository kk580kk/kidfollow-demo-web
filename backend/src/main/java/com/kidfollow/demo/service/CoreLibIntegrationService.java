package com.kidfollow.demo.service;

import com.kidfollow.driving.DecisionEngine;
import com.kidfollow.driving.DecisionEngine.Decision;
import com.kidfollow.sensor.SensorData;
import com.kidfollow.sensor.SensorFusionEngine;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core-lib 集成服务
 * 集成 kidfollow-core-lib 的核心功能到 demo-web
 */
@Service
public class CoreLibIntegrationService {
    
    private final DecisionEngine decisionEngine;
    
    // 场景状态存储
    private final Map<String, Object> sceneState = new ConcurrentHashMap<>();
    
    // WebSocket通信统计
    private final Map<String, Long> messageStats = new ConcurrentHashMap<>();
    
    public CoreLibIntegrationService() {
        this.decisionEngine = new DecisionEngine();
        
        // 初始化统计
        messageStats.put("sent", 0L);
        messageStats.put("received", 0L);
        messageStats.put("errors", 0L);
    }
    
    /**
     * 处理3D场景的传感器数据并生成决策
     */
    public Decision processSceneData(Map<String, Object> sceneData) {
        // 更新场景状态
        sceneState.putAll(sceneData);
        
        // 构建SensorData
        SensorData sensorData = buildSensorDataFromScene(sceneData);
        
        // 执行决策
        Decision decision = decisionEngine.decide(sensorData);
        
        // 记录接收消息
        messageStats.merge("received", 1L, Long::sum);
        
        return decision;
    }
    
    /**
     * 从场景数据构建SensorData
     */
    private SensorData buildSensorDataFromScene(Map<String, Object> sceneData) {
        SensorData data = new SensorData();
        data.setTimestamp(System.currentTimeMillis());
        
        // GPS数据
        if (sceneData.containsKey("gps")) {
            Map<String, Object> gps = (Map<String, Object>) sceneData.get("gps");
            double lat = ((Number) gps.getOrDefault("lat", 39.9)).doubleValue();
            double lng = ((Number) gps.getOrDefault("lng", 116.4)).doubleValue();
            data.setGps(new SensorData.GPSData(lat, lng));
        } else {
            data.setGps(new SensorData.GPSData(39.9042, 116.4074));
        }
        
        // 电池数据
        if (sceneData.containsKey("battery")) {
            data.setBattery(((Number) sceneData.get("battery")).intValue());
        } else {
            data.setBattery(85);  // 默认值
        }
        
        // 激光雷达数据
        if (sceneData.containsKey("laserScan")) {
            Map<String, Object> laser = (Map<String, Object>) sceneData.get("laserScan");
            List<Number> rangesList = (List<Number>) laser.get("ranges");
            List<Number> anglesList = (List<Number>) laser.get("angles");
            
            if (rangesList != null && anglesList != null) {
                float[] ranges = new float[rangesList.size()];
                float[] angles = new float[anglesList.size()];
                for (int i = 0; i < rangesList.size(); i++) {
                    ranges[i] = rangesList.get(i).floatValue();
                    angles[i] = anglesList.get(i).floatValue();
                }
                SensorData.LaserScanData laserData = new SensorData.LaserScanData(ranges, angles);
                laserData.setObstacleDetected((Boolean) laser.getOrDefault("obstacleDetected", false));
                laserData.setGroundHoleDetected(false);
                data.setLaserScan(laserData);
            }
        }
        
        // 超声波数据
        if (sceneData.containsKey("ultrasonic")) {
            Map<String, Object> ultrasonic = (Map<String, Object>) sceneData.get("ultrasonic");
            SensorData.UltrasonicRadarData radarData = new SensorData.UltrasonicRadarData();
            radarData.setFrontLeft(((Number) ultrasonic.getOrDefault("frontLeft", 50)).floatValue());
            radarData.setFrontRight(((Number) ultrasonic.getOrDefault("frontRight", 50)).floatValue());
            radarData.setFrontTop(((Number) ultrasonic.getOrDefault("frontTop", 50)).floatValue());
            radarData.setFrontBottom(((Number) ultrasonic.getOrDefault("frontBottom", 50)).floatValue());
            radarData.setRearLeft(45);
            radarData.setRearRight(42);
            radarData.setRearTop(38);
            radarData.setRearBottom(40);
            data.setUltrasonicRadar(radarData);
        }
        
        // 视觉数据
        if (sceneData.containsKey("visualTarget")) {
            Map<String, Object> visual = (Map<String, Object>) sceneData.get("visualTarget");
            boolean detected = (Boolean) visual.getOrDefault("detected", false);
            float confidence = ((Number) visual.getOrDefault("confidence", 0)).floatValue();
            
            Map<String, Number> pos = (Map<String, Number>) visual.get("position");
            float x = pos != null ? pos.getOrDefault("x", 0f).floatValue() : 0f;
            float y = pos != null ? pos.getOrDefault("y", 0f).floatValue() : 0f;
            
            data.setVisualTarget(new SensorData.VisualTarget(
                "child", confidence, new SensorData.Position(x, y)
            ));
            data.setChildPresent(detected);
        } else {
            data.setChildPresent(false);
        }
        
        // 围栏状态
        if (sceneData.containsKey("fenceStatus")) {
            String fenceStatus = (String) sceneData.get("fenceStatus");
            try {
                data.setFenceStatus(SensorData.FenceStatus.valueOf(fenceStatus));
            } catch (Exception e) {
                data.setFenceStatus(SensorData.FenceStatus.SAFE);
            }
        } else {
            data.setFenceStatus(SensorData.FenceStatus.SAFE);
        }
        
        return data;
    }
    
    /**
     * 记录消息发送
     */
    public void recordMessageSent() {
        messageStats.merge("sent", 1L, Long::sum);
    }
    
    /**
     * 记录消息错误
     */
    public void recordMessageError() {
        messageStats.merge("errors", 1L, Long::sum);
    }
    
    /**
     * 获取通信统计
     */
    public Map<String, Object> getCommunicationStats() {
        long sent = messageStats.getOrDefault("sent", 0L);
        long received = messageStats.getOrDefault("received", 0L);
        long errors = messageStats.getOrDefault("errors", 0L);
        
        double successRate = sent > 0 ? ((sent - errors) * 100.0 / sent) : 100.0;
        
        return Map.of(
            "sent", sent,
            "received", received,
            "errors", errors,
            "successRate", String.format("%.2f%%", successRate),
            "isHealthy", successRate >= 99.0
        );
    }
    
    /**
     * 重置统计
     */
    public void resetStats() {
        messageStats.put("sent", 0L);
        messageStats.put("received", 0L);
        messageStats.put("errors", 0L);
    }
    
    /**
     * 获取当前场景状态
     */
    public Map<String, Object> getSceneState() {
        return new ConcurrentHashMap<>(sceneState);
    }
}
