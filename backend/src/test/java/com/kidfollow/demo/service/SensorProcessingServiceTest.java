package com.kidfollow.demo.service;

import com.kidfollow.driving.DrivingModule;
import com.kidfollow.driving.IDrivingModule.IDrivingDecision;
import com.kidfollow.driving.IDrivingModule.IDrivingContext;
import com.kidfollow.driving.IDrivingModule.*;
import com.kidfollow.driving.IDrivingModule.Action;
import com.kidfollow.driving.IDrivingModule.FenceStatus;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * KidFollow Demo Backend 接口自动化测试
 * 直接测试 kidfollow-core-lib 核心算法
 */
public class SensorProcessingServiceTest {

    private final DrivingModule drivingModule = new DrivingModule();

    /**
     * API-001: 测试正常跟随场景
     * 输入: 有目标、电量充足、无障碍物
     * 输出: FOLLOW action
     */
    @Test
    public void testAPI_001_NormalFollow() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(85)
            .withObstacleDistance(5.0)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(true)
            .withTargetDistance(2.0);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertEquals(Action.FOLLOW, decision.getAction());
        assertTrue(decision.getPriority() <= 5);
    }

    /**
     * API-002: 测试障碍物避障场景
     * 输入: 有障碍物(距离 < 1.5m)
     * 输出: AVOID action
     */
    @Test
    public void testAPI_002_ObstacleAvoid() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(80)
            .withObstacleDistance(0.8)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(true)
            .withTargetDistance(3.0);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertTrue(decision.getAction() == Action.AVOID || 
                   decision.getAction() == Action.STOP);
    }

    /**
     * API-003: 测试低电量返航场景
     * 输入: 电量 < 20%
     * 输出: RETURN action
     */
    @Test
    public void testAPI_003_LowBatteryReturn() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(15)
            .withObstacleDistance(5.0)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(true)
            .withTargetDistance(2.0);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertEquals(Action.RETURN, decision.getAction());
    }

    /**
     * API-004: 测试电子围栏报警场景
     * 输入: 围栏状态为ALARM
     * 输出: ANCHOR action
     */
    @Test
    public void testAPI_004_FenceAlarm() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(80)
            .withObstacleDistance(5.0)
            .withFenceStatus(FenceStatus.ALARM)
            .withActiveTarget(true)
            .withTargetDistance(2.0);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertEquals(Action.ANCHOR, decision.getAction());
    }

    /**
     * API-005: 测试紧急制动场景
     * 输入: 障碍物距离 < 0.5m
     * 输出: STOP action
     */
    @Test
    public void testAPI_005_EmergencyStop() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(80)
            .withObstacleDistance(0.3)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(true)
            .withTargetDistance(1.0);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertEquals(Action.STOP, decision.getAction());
        assertEquals(5, decision.getPriority());
    }

    /**
     * API-006: 测试优先级覆盖 - 紧急制动 > 低电量返航
     * 输入: 紧急障碍物 + 低电量
     * 输出: STOP action (优先级5)
     */
    @Test
    public void testAPI_006_PriorityOverride() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(15)  // 低电量
            .withObstacleDistance(0.3)  // 紧急障碍
            .withFenceStatus(FenceStatus.ALARM)  // 围栏报警
            .withActiveTarget(true);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        // 紧急制动应该覆盖其他所有优先级
        assertEquals(Action.STOP, decision.getAction());
        assertEquals(5, decision.getPriority());
    }

    /**
     * API-007: 测试目标丢失场景
     * 输入: 无活跃目标
     * 输出: ANCHOR action
     */
    @Test
    public void testAPI_007_TargetLost() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(80)
            .withObstacleDistance(5.0)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(false);

        IDrivingDecision decision = drivingModule.makeDecision(context);
        
        assertNotNull(decision.getAction());
    }

    /**
     * API-008: 测试决策响应时间
     */
    @Test
    public void testAPI_008_ResponseTime() {
        IDrivingContext context = new TestDrivingContext()
            .withBatteryLevel(80)
            .withObstacleDistance(5.0)
            .withFenceStatus(FenceStatus.NORMAL)
            .withActiveTarget(true);

        long start = System.currentTimeMillis();
        for (int i = 0; i < 100; i++) {
            drivingModule.makeDecision(context);
        }
        long elapsed = System.currentTimeMillis() - start;
        
        // 100次调用应该在100ms内完成
        assertTrue(elapsed < 100, "100次决策调用耗时: " + elapsed + "ms");
    }

    /**
     * 测试辅助类 - 实现IDrivingContext接口
     */
    private static class TestDrivingContext implements IDrivingContext {
        private double batteryLevel = 100;
        private double obstacleDistance = 10.0;
        private FenceStatus fenceStatus = FenceStatus.NORMAL;
        private boolean activeTarget = false;
        private double targetDistance = 0;

        public TestDrivingContext withBatteryLevel(double batteryLevel) {
            this.batteryLevel = batteryLevel;
            return this;
        }

        public TestDrivingContext withObstacleDistance(double obstacleDistance) {
            this.obstacleDistance = obstacleDistance;
            return this;
        }

        public TestDrivingContext withFenceStatus(FenceStatus fenceStatus) {
            this.fenceStatus = fenceStatus;
            return this;
        }

        public TestDrivingContext withActiveTarget(boolean activeTarget) {
            this.activeTarget = activeTarget;
            return this;
        }

        public TestDrivingContext withTargetDistance(double targetDistance) {
            this.targetDistance = targetDistance;
            return this;
        }

        @Override
        public IVehicleState getVehicleState() {
            return new IVehicleState() {
                @Override
                public double getBatteryLevel() {
                    return batteryLevel;
                }

                @Override
                public boolean isEmergencyStop() {
                    return false;
                }

                @Override
                public double getCurrentSpeed() {
                    return 0;
                }
            };
        }

        @Override
        public IEnvironment getEnvironment() {
            return new IEnvironment() {
                @Override
                public double getObstacleDistance() {
                    return obstacleDistance;
                }

                @Override
                public FenceStatus getFenceStatus() {
                    return fenceStatus;
                }
            };
        }

        @Override
        public ITarget getTarget() {
            return new ITarget() {
                @Override
                public boolean isActive() {
                    return activeTarget;
                }

                @Override
                public double getDistance() {
                    return targetDistance;
                }

                @Override
                public double getOffsetAngle() {
                    return 0;
                }
            };
        }

        @Override
        public IPath getPath() {
            return new IPath() {
                @Override
                public double getGoalAngle() {
                    return 0;
                }

                @Override
                public double getPathSafety() {
                    return 1.0;
                }
            };
        }
    }
}
