package com.kidfollow.demo.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 基于3D场景的传感器数据服务
 * 根据实际场景状态生成真实的传感器数据
 */
@Service
@EnableScheduling
public class SceneBasedSensorService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private CoreLibIntegrationService coreLibService;
    
    // 场景状态
    private volatile Map<String, Object> currentScene = new ConcurrentHashMap<>();
    
    // 车辆位置
    private double[] vehiclePosition = {0, 0, 0};
    private double vehicleRotation = 0;
    private double vehicleSpeed = 0;
    
    // 目标（家长）位置 - 由前端控制
    private double[] targetPosition = {2, 0, 2};
    private boolean targetDetected = true;
    
    // 障碍物列表
    private List<Map<String, Object>> obstacles = new ArrayList<>();
    
    // 电子围栏
    private double fenceRadius = 8.0; // 8米围栏
    
    // 电池电量 - 固定值，不跳跃
    private int batteryLevel = 85;
    
    // 当前决策
    private String currentMode = "FOLLOW";
    private String decisionReason = "等待目标";
    
    /**
     * 更新场景状态（由前端调用）
     */
    public void updateSceneState(Map<String, Object> sceneData) {
        this.currentScene = new ConcurrentHashMap<>(sceneData);
        
        // 更新车辆位置
        if (sceneData.containsKey("vehicle")) {
            Map<String, Object> vehicle = (Map<String, Object>) sceneData.get("vehicle");
            if (vehicle.containsKey("position")) {
                List<Number> pos = (List<Number>) vehicle.get("position");
                vehiclePosition = new double[]{pos.get(0).doubleValue(), pos.get(1).doubleValue(), pos.get(2).doubleValue()};
            }
            if (vehicle.containsKey("rotation")) {
                vehicleRotation = ((Number) vehicle.get("rotation")).doubleValue();
            }
        }
        
        // 更新目标位置
        if (sceneData.containsKey("target")) {
            Map<String, Object> target = (Map<String, Object>) sceneData.get("target");
            if (target.containsKey("position")) {
                List<Number> pos = (List<Number>) target.get("position");
                targetPosition = new double[]{pos.get(0).doubleValue(), pos.get(1).doubleValue(), pos.get(2).doubleValue()};
                targetDetected = (Boolean) target.getOrDefault("detected", true);
            }
        }
        
        // 更新障碍物
        if (sceneData.containsKey("obstacles")) {
            obstacles = (List<Map<String, Object>>) sceneData.get("obstacles");
        }
    }
    
    /**
     * 每100ms计算并发送传感器数据
     */
    @Scheduled(fixedRate = 100)
    public void sendSensorData() {
        // 计算距离和角度
        double dx = targetPosition[0] - vehiclePosition[0];
        double dz = targetPosition[2] - vehiclePosition[2];
        double distanceToTarget = Math.sqrt(dx * dx + dz * dz);
        double angleToTarget = Math.toDegrees(Math.atan2(dx, dz));
        
        // 计算围栏状态
        double distanceFromCenter = Math.sqrt(vehiclePosition[0] * vehiclePosition[0] + vehiclePosition[2] * vehiclePosition[2]);
        String fenceStatus = distanceFromCenter > fenceRadius ? "ALARM" : 
                            (distanceFromCenter > fenceRadius * 0.8 ? "WARNING" : "SAFE");
        
        // 检测前方障碍物
        double nearestObstacleDist = 10.0;
        double nearestObstacleAngle = 0;
        boolean obstacleDetected = false;
        String obstacleType = null;
        
        for (Map<String, Object> obs : obstacles) {
            if (obs.containsKey("position")) {
                List<Number> obsPos = (List<Number>) obs.get("position");
                double ox = obsPos.get(0).doubleValue() - vehiclePosition[0];
                double oz = obsPos.get(2).doubleValue() - vehiclePosition[2];
                double obsDist = Math.sqrt(ox * ox + oz * oz);
                double obsAngle = Math.toDegrees(Math.atan2(ox, oz));
                
                // 只检测前方（-70到+70度）的障碍物
                double angleDiff = normalizeAngle(obsAngle - vehicleRotation);
                if (Math.abs(angleDiff) < 70 && obsDist < nearestObstacleDist) {
                    nearestObstacleDist = obsDist;
                    nearestObstacleAngle = angleDiff;
                    obstacleDetected = true;
                    obstacleType = (String) obs.get("type");
                }
            }
        }
        
        // 计算超声波数据
        int ultrasonicFrontLeft = calculateUltrasonicDistance(-0.3, 0);
        int ultrasonicFrontRight = calculateUltrasonicDistance(0.3, 0);
        int ultrasonicFrontTop = calculateUltrasonicDistance(0, 0.2);
        int ultrasonicFrontBottom = calculateUltrasonicDistance(0, -0.2);
        int ultrasonicFrontMin = Math.min(Math.min(ultrasonicFrontLeft, ultrasonicFrontRight), 
                                         Math.min(ultrasonicFrontTop, ultrasonicFrontBottom));
        
        // 激光雷达数据
        double[] laserRanges = new double[8];
        int[] laserAngles = new int[]{0, -30, 30, -60, 60, -90, 90, 180};
        
        for (int i = 0; i < laserAngles.length; i++) {
            double angleRad = Math.toRadians(vehicleRotation + laserAngles[i]);
            laserRanges[i] = calculateLaserDistance(angleRad);
        }
        
        // 视觉系统数据
        double visualConfidence = 0;
        if (targetDetected && distanceToTarget < 8) {
            visualConfidence = Math.min(0.98, 0.6 + (8 - distanceToTarget) / 8 * 0.4);
        }
        
        // 构建传感器数据 - 使用HashMap允许null值
        Map<String, Object> laserScanData = new java.util.HashMap<>();
        laserScanData.put("ranges", laserRanges);
        laserScanData.put("angles", laserAngles);
        laserScanData.put("obstacleDetected", obstacleDetected);
        laserScanData.put("nearestObstacleDistance", nearestObstacleDist);
        laserScanData.put("nearestObstacleAngle", nearestObstacleAngle);
        laserScanData.put("nearestObstacleType", obstacleType);
        
        Map<String, Object> ultrasonicData = new java.util.HashMap<>();
        ultrasonicData.put("frontLeft", ultrasonicFrontLeft);
        ultrasonicData.put("frontRight", ultrasonicFrontRight);
        ultrasonicData.put("frontTop", ultrasonicFrontTop);
        ultrasonicData.put("frontBottom", ultrasonicFrontBottom);
        ultrasonicData.put("frontMin", ultrasonicFrontMin);
        ultrasonicData.put("rearLeft", 45);
        ultrasonicData.put("rearRight", 42);
        ultrasonicData.put("rearTop", 38);
        ultrasonicData.put("rearBottom", 40);
        
        Map<String, Object> visualTargetData = new java.util.HashMap<>();
        visualTargetData.put("type", "child");
        visualTargetData.put("confidence", visualConfidence);
        visualTargetData.put("position", Map.of("x", dx, "y", distanceToTarget, "z", dz));
        visualTargetData.put("detected", targetDetected);
        
        Map<String, Object> sensorDataInner = new java.util.HashMap<>();
        sensorDataInner.put("timestamp", System.currentTimeMillis());
        sensorDataInner.put("battery", batteryLevel);
        sensorDataInner.put("gps", Map.of("lat", 39.9042 + vehiclePosition[0] * 0.0001, 
                                           "lng", 116.4074 + vehiclePosition[2] * 0.0001));
        sensorDataInner.put("laserScan", laserScanData);
        sensorDataInner.put("ultrasonicRadar", ultrasonicData);
        sensorDataInner.put("visualTarget", visualTargetData);
        sensorDataInner.put("childPresent", targetDetected);
        sensorDataInner.put("fenceStatus", fenceStatus);
        
        Map<String, Object> sensorData = new java.util.HashMap<>();
        sensorData.put("sensorData", sensorDataInner);
        
        messagingTemplate.convertAndSend("/topic/sensor", sensorData);
        coreLibService.recordMessageSent();
        
        // 生成决策
        generateDecision(obstacleDetected, nearestObstacleDist, ultrasonicFrontMin, 
                        distanceToTarget, fenceStatus);
    }
    
    /**
     * 生成驾驶决策
     */
    private void generateDecision(boolean obstacleDetected, double obstacleDist, 
                                  int ultrasonicMin, double targetDist, String fenceStatus) {
        String newMode = "STOP";
        String newReason = "停止等待";
        int newSpeed = 0;
        double newAngle = 0;
        
        // 决策优先级：STOP > RETURN > ANCHOR > AVOID > FOLLOW
        
        // 1. 紧急停止条件
        if (ultrasonicMin < 30) {
            newMode = "STOP";
            newReason = "超声波近距离碰撞风险: " + ultrasonicMin + "cm";
        } else if (obstacleDetected && obstacleDist < 1.0) {
            newMode = "STOP";
            newReason = "前方危险障碍物: " + String.format("%.2f", obstacleDist) + "m";
        }
        // 2. 返航条件
        else if ("ALARM".equals(fenceStatus)) {
            newMode = "RETURN";
            newReason = "超出围栏边界，触发返航";
            newSpeed = -50;
        }
        // 3. 锚定条件
        else if ("WARNING".equals(fenceStatus)) {
            newMode = "ANCHOR";
            newReason = "接近围栏边界，锚定等待";
        }
        // 4. 避障条件
        else if (obstacleDetected && obstacleDist < 3.0) {
            newMode = "AVOID";
            newReason = "前方障碍物(" + String.format("%.2f", obstacleDist) + "m)，执行避障";
            newSpeed = obstacleDist < 1.5 ? 20 : 40;
            newAngle = 30; // 向右转
        } else if (ultrasonicMin < 50) {
            newMode = "AVOID";
            newReason = "超声波预警: " + ultrasonicMin + "cm";
            newSpeed = 30;
            newAngle = 30;
        }
        // 5. 跟随条件
        else if (targetDetected && targetDist > 0.5) {
            newMode = "FOLLOW";
            newReason = "跟随目标(" + String.format("%.2f", targetDist) + "m)";
            
            if (targetDist > 4) {
                newSpeed = 80;
            } else if (targetDist > 3) {
                newSpeed = 60;
            } else if (targetDist > 2) {
                newSpeed = 40;
            } else {
                newSpeed = 20;
            }
        }
        
        // 更新决策
        currentMode = newMode;
        decisionReason = newReason;
        vehicleSpeed = newSpeed;
        
        // 发送决策 - 使用HashMap
        Map<String, Object> decisionInner = new java.util.HashMap<>();
        decisionInner.put("type", newMode);
        decisionInner.put("speed", newSpeed);
        decisionInner.put("angle", newAngle);
        decisionInner.put("reason", newReason);
        decisionInner.put("timestamp", System.currentTimeMillis());
        
        Map<String, Object> decision = new java.util.HashMap<>();
        decision.put("decision", decisionInner);
        decision.put("vehiclePosition", vehiclePosition);
        
        messagingTemplate.convertAndSend("/topic/decision", decision);
        
        // 发送车辆状态 - 使用HashMap
        Map<String, Object> vehicleState = new java.util.HashMap<>();
        vehicleState.put("position", vehiclePosition);
        vehicleState.put("rotation", new double[]{0, vehicleRotation, 0});
        vehicleState.put("speed", newSpeed);
        vehicleState.put("mode", newMode);
        vehicleState.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/vehicle", vehicleState);
    }
    
    /**
     * 计算超声波距离（基于场景）
     */
    private int calculateUltrasonicDistance(double offsetX, double offsetZ) {
        double sensorX = vehiclePosition[0] + offsetX;
        double sensorZ = vehiclePosition[2] + offsetZ;
        
        double minDist = 400; // 最大检测距离
        
        for (Map<String, Object> obs : obstacles) {
            if (obs.containsKey("position")) {
                List<Number> obsPos = (List<Number>) obs.get("position");
                double dx = obsPos.get(0).doubleValue() - sensorX;
                double dz = obsPos.get(2).doubleValue() - sensorZ;
                double dist = Math.sqrt(dx * dx + dz * dz) * 100; // 转为cm
                
                if (dist < minDist) {
                    minDist = dist;
                }
            }
        }
        
        return (int) minDist;
    }
    
    /**
     * 计算激光雷达距离（基于场景）
     */
    private double calculateLaserDistance(double angleRad) {
        double sensorX = vehiclePosition[0];
        double sensorZ = vehiclePosition[2];
        
        double minDist = 10.0; // 最大检测距离
        
        for (Map<String, Object> obs : obstacles) {
            if (obs.containsKey("position")) {
                List<Number> obsPos = (List<Number>) obs.get("position");
                double ox = obsPos.get(0).doubleValue() - sensorX;
                double oz = obsPos.get(2).doubleValue() - sensorZ;
                double dist = Math.sqrt(ox * ox + oz * oz);
                double obsAngle = Math.atan2(ox, oz);
                
                // 检查是否在该角度方向上
                double angleDiff = normalizeAngle(Math.toDegrees(obsAngle - angleRad));
                if (Math.abs(angleDiff) < 10 && dist < minDist) {
                    minDist = dist;
                }
            }
        }
        
        return minDist;
    }
    
    /**
     * 标准化角度到 -180 到 180
     */
    private double normalizeAngle(double angle) {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }
    
    /**
     * 获取当前场景状态
     */
    public Map<String, Object> getSceneState() {
        return new ConcurrentHashMap<>(currentScene);
    }
    
    /**
     * 获取当前决策
     */
    public Map<String, Object> getCurrentDecision() {
        return Map.of(
            "mode", currentMode,
            "reason", decisionReason,
            "speed", vehicleSpeed
        );
    }
}
