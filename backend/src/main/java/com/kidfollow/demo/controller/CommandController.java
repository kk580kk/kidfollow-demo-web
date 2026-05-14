package com.kidfollow.demo.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;

/**
 * 命令控制器 - 处理前端发送的控制命令
 */
@Controller
public class CommandController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 处理控制命令
     * @param command 命令数据
     * @return 命令处理结果
     */
    @MessageMapping("/command")
    public void handleCommand(Map<String, Object> command) {
        String cmdType = (String) command.get("command");
        Map<String, Object> data = (Map<String, Object>) command.get("data");
        
        System.out.println("收到命令: " + cmdType + ", 数据: " + data);
        
        // 根据命令类型处理
        switch (cmdType) {
            case "MODE_CHANGE":
                handleModeChange(data);
                break;
            case "EMERGENCY_STOP":
                handleEmergencyStop();
                break;
            default:
                System.out.println("未知命令类型: " + cmdType);
        }
    }

    private void handleModeChange(Map<String, Object> data) {
        String mode = (String) data.get("mode");
        System.out.println("切换模式到: " + mode);
        
        // 广播模式变更
        messagingTemplate.convertAndSend("/topic/vehicle", Map.of(
            "mode", mode,
            "speed", mode.equals("STOP") ? 0 : (mode.equals("FOLLOW") ? 3 : 0),
            "timestamp", System.currentTimeMillis()
        ));
    }

    private void handleEmergencyStop() {
        System.out.println("紧急制动！");
        
        messagingTemplate.convertAndSend("/topic/vehicle", Map.of(
            "mode", "STOP",
            "speed", 0,
            "emergency", true,
            "timestamp", System.currentTimeMillis()
        ));
    }
}
