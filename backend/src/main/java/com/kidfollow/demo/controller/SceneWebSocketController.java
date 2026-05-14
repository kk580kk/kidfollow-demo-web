package com.kidfollow.demo.controller;

import com.kidfollow.demo.service.SceneBasedSensorService;
import com.kidfollow.demo.service.CoreLibIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * 场景WebSocket控制器
 * 接收前端3D场景状态，返回传感器数据和决策
 */
@Controller
public class SceneWebSocketController {
    
    @Autowired
    private SceneBasedSensorService sceneService;
    
    @Autowired
    private CoreLibIntegrationService coreLibService;
    
    /**
     * 接收前端场景状态更新
     */
    @MessageMapping("/scene-update")
    public void receiveSceneUpdate(@Payload Map<String, Object> sceneData) {
        // 更新场景状态
        sceneService.updateSceneState(sceneData);
        
        // 记录接收
        coreLibService.recordMessageSent();
    }
    
    /**
     * 接收车辆控制命令
     */
    @MessageMapping("/vehicle-control")
    public void receiveVehicleControl(@Payload Map<String, Object> controlData) {
        // 处理控制命令
        sceneService.updateSceneState(Map.of("control", controlData));
    }
    
    /**
     * 获取通信统计
     */
    @MessageMapping("/comm-stats")
    @SendToUser("/queue/stats")
    public Map<String, Object> getCommunicationStats() {
        return coreLibService.getCommunicationStats();
    }
    
    /**
     * 重置通信统计
     */
    @MessageMapping("/reset-stats")
    public void resetStats() {
        coreLibService.resetStats();
    }
}
