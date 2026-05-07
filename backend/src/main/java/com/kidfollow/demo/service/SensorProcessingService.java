package com.kidfollow.demo.service;

import org.springframework.stereotype.Service;
import com.kidfollow.modules.M1Driving.DrivingModule;
import com.kidfollow.modules.M1Driving.DrivingDecision;
import com.kidfollow.modules.M1Driving.SensorData;

/**
 * 传感器数据处理服务 - 集成 kidfollow-core-lib 核心算法
 */
@Service
public class SensorProcessingService {
    
    private final DrivingModule drivingModule = new DrivingModule();
    
    /**
     * 处理传感器数据并返回驾驶决策
     * @param sensorData 传感器输入数据
     * @return 驾驶决策结果
     */
    public DrivingDecision processSensorData(SensorData sensorData) {
        return drivingModule.makeDecision(sensorData);
    }
}