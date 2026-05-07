package com.kidfollow.backend;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

/**
 * 后端接口自动化测试套件
 * 运行所有测试类
 */
@Suite
@SuiteDisplayName("KidFollow Backend Test Suite")
@SelectClasses({
    KidFollowApplicationTests.class,
    com.kidfollow.backend.controller.SensorWebSocketHandlerTest.class,
    com.kidfollow.backend.controller.WebSocketIntegrationTest.class
})
public class TestSuite {
    // 测试套件入口
    // 运行: mvn test -Dtest=TestSuite
}
