package com.kidfollow.demo.service;

import org.springframework.stereotype.Service;
import com.kidfollow.driving.DrivingModule;
import com.kidfollow.driving.IDrivingModule.IDrivingDecision;
import com.kidfollow.driving.IDrivingModule.IDrivingContext;

/**
 * 传感器数据处理服务 - 集成 kidfollow-core-lib 核心算法
 */
@Service
public class SensorProcessingService {
    
    private final DrivingModule drivingModule = new DrivingModule();
    
    /**
     * 处理传感器数据并返回驾驶决策
     * @param context 驾驶上下文
     * @return 驾驶决策结果
     */
    public IDrivingDecision processSensorData(IDrivingContext context) {
        return drivingModule.makeDecision(context);
    }
}