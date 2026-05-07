package com.kidfollow.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidfollow.sensor.SensorData;
import com.kidfollow.sensor.SensorFusionEngine;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 传感器融合服务
 * 封装 kidfollow-core-lib 的 SensorFusionEngine 调用
 */
@Service
public class SensorFusionService {

    private final SensorFusionEngine fusionEngine;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SensorFusionService() {
        this.fusionEngine = new SensorFusionEngine();
    }

    /**
     * 获取融合后的传感器数据
     */
    public Map<String, Object> getFusedSensorData() {
        Map<String, Object> data = new HashMap<>();

        // 添加模拟数据（实际实现需要根据SensorFusionEngine API调整）
        data.put("laserScan", getMockLaserData());
        data.put("ultrasonic", getMockUltrasonicData());
        data.put("visual", getMockVisualData());
        data.put("timestamp", System.currentTimeMillis());
        data.put("mode", "NORMAL");

        return data;
    }

    private Map<String, Object> getMockLaserData() {
        Map<String, Object> map = new HashMap<>();
        map.put("ranges", new float[]{5.0f, 5.0f, 5.0f});
        map.put("angles", new float[]{-90, 0, 90});
        map.put("obstacleDetected", false);
        map.put("minDistance", 5.0);
        return map;
    }

    private Map<String, Object> getMockUltrasonicData() {
        Map<String, Object> map = new HashMap<>();
        map.put("frontLeft", 50.0);
        map.put("frontRight", 50.0);
        map.put("frontTop", 50.0);
        map.put("frontBottom", 50.0);
        map.put("rearLeft", 50.0);
        map.put("rearRight", 50.0);
        map.put("rearTop", 50.0);
        map.put("rearBottom", 50.0);
        return map;
    }

    private Map<String, Object> getMockVisualData() {
        Map<String, Object> map = new HashMap<>();
        map.put("type", "child");
        map.put("confidence", 0.95);
        map.put("position", Map.of("x", 2.0, "y", 0.0));
        return map;
    }

    /**
     * 获取融合的传感器数据（用于 WebSocket 传输）
     */
    public String getFusedSensorDataJson() throws Exception {
        Map<String, Object> data = getFusedSensorData();
        return objectMapper.writeValueAsString(data);
    }
}
