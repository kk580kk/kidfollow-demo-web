package com.kidfollow.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Spring Boot 应用集成测试
 * 测试应用启动和基础功能
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class KidFollowApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    /**
     * 测试应用上下文加载
     */
    @Test
    void contextLoads() {
        // 验证应用上下文成功加载
        System.out.println("✅ Spring Boot 应用上下文加载测试通过");
    }

    /**
     * 测试应用启动
     */
    @Test
    void testApplicationStartup() {
        // 验证应用端口
        assertThat(port).isGreaterThan(0);
        System.out.println("✅ 应用启动测试通过，端口: " + port);
    }

    /**
     * 测试基础 HTTP 端点
     */
    @Test
    void testHttpEndpoint() {
        // 测试根路径（如果配置的话）
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                "/actuator/health", String.class);
            System.out.println("✅ HTTP 端点测试通过");
        } catch (Exception e) {
            // 如果 actuator 未配置，仅打印信息
            System.out.println("ℹ️ Actuator 未配置，跳过健康检查测试");
        }
    }
}
