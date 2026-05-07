package com.kidfollow.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import com.kidfollow.demo.service.SensorProcessingService;
import com.kidfollow.driving.IDrivingModule.IDrivingContext;
import com.kidfollow.driving.IDrivingModule.IDrivingDecision;

/**
 * WebSocket 控制器 - 处理传感器数据和返回决策结果
 */
@Controller
public class SensorWebSocketController {
    
    @Autowired
    private SensorProcessingService sensorProcessingService;
    
    /**
     * 处理传感器数据并返回驾驶决策
     * @param context 驾驶上下文
     * @return 驾驶决策结果
     */
    @MessageMapping("/sensor-data")
    @SendTo("/topic/decision")
    public IDrivingDecision processSensorData(IDrivingContext context) {
        return sensorProcessingService.processSensorData(context);
    }
}