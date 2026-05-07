package com.kidfollow.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import com.kidfollow.demo.service.SensorProcessingService;
import com.kidfollow.modules.M1Driving.DrivingDecision;
import com.kidfollow.modules.M1Driving.SensorData;

/**
 * WebSocket 控制器 - 处理传感器数据和返回决策结果
 */
@Controller
public class SensorWebSocketController {
    
    @Autowired
    private SensorProcessingService sensorProcessingService;
    
    /**
     * 处理传感器数据并返回驾驶决策
     * @param sensorData 传感器输入数据
     * @return 驾驶决策结果
     */
    @MessageMapping("/sensor-data")
    @SendTo("/topic/decision")
    public DrivingDecision processSensorData(SensorData sensorData) {
        return sensorProcessingService.processSensorData(sensorData);
    }
}