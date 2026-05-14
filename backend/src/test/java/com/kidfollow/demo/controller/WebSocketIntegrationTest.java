package com.kidfollow.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * WebSocket 集成测试
 * 完整测试 WebSocket/STOMP 通信链路
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private com.kidfollow.demo.service.CoreLibIntegrationService coreLibService;

    private static final int TIMEOUT_SECONDS = 10;

    /**
     * 测试 WebSocket/STOMP 连接建立
     */
    @Test
    void testWebSocketConnection() throws Exception {
        // 创建STOMP客户端
        WebSocketStompClient stompClient = new WebSocketStompClient(
            new SockJsClient(Collections.singletonList(new WebSocketTransport(new StandardWebSocketClient())))
        );
        
        // 连接STOMP端点
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        
        stompClient.connect(
            String.format("ws://localhost:%d/sensor-ws", port),
            new StompSessionHandlerAdapter() {
                @Override
                public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                    sessionFuture.complete(session);
                }
                
                @Override
                public void handleException(org.springframework.messaging.simp.stomp.StompSession session, 
                                          StompCommand command, StompHeaders headers, 
                                          byte[] payload, Throwable exception) {
                    sessionFuture.completeExceptionally(exception);
                }
            }
        );
        
        // 等待连接建立
        StompSession session = sessionFuture.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        
        // 验证连接成功
        assertTrue(session.isConnected(), "WebSocket连接应该建立");
        System.out.println("✅ WebSocket/STOMP 连接建立成功");
        
        // 发送场景更新
        assertDoesNotThrow(() -> {
            session.send("/app/scene-update", """
                {"vehicle": {"position": [0, 0, 0], "rotation": 0}, \
                 "target": {"position": [2, 0, 2], "detected": true}, \
                 "obstacles": []}
                """.getBytes());
        });
        
        System.out.println("✅ 场景更新发送成功");
        
        // 关闭连接
        session.disconnect();
        stompClient.stop();
    }

    /**
     * 测试通信统计功能
     */
    @Test
    void testWebSocketCommunicationStats() {
        // 重置统计
        coreLibService.resetStats();
        
        // 记录一些消息
        coreLibService.recordMessageSent();
        coreLibService.recordMessageSent();
        
        // 获取统计
        var stats = coreLibService.getCommunicationStats();
        
        // 验证统计
        assertThat(stats).containsKey("sent");
        assertThat(stats).containsKey("successRate");
        assertThat(stats.get("sent")).isEqualTo(2L);
        assertThat(stats.get("successRate")).isEqualTo("100.00%");
        assertThat(stats.get("isHealthy")).isEqualTo(true);
        
        System.out.println("✅ WebSocket 通信统计测试通过: " + stats);
    }

    /**
     * 测试延迟性能（验证服务响应能力）
     */
    @Test
    void testWebSocketLatency() throws Exception {
        long startTime = System.currentTimeMillis();
        
        // 创建STOMP客户端
        WebSocketStompClient stompClient = new WebSocketStompClient(
            new SockJsClient(Collections.singletonList(new WebSocketTransport(new StandardWebSocketClient())))
        );
        
        CompletableFuture<StompSession> sessionFuture = new CompletableFuture<>();
        
        stompClient.connect(
            String.format("ws://localhost:%d/sensor-ws", port),
            new StompSessionHandlerAdapter() {
                @Override
                public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                    sessionFuture.complete(session);
                }
            }
        );
        
        // 等待连接
        StompSession session = sessionFuture.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        long connectTime = System.currentTimeMillis() - startTime;
        
        // 验证连接延迟 < 5秒
        assertThat(connectTime).isLessThan(5000);
        System.out.println("✅ WebSocket 延迟测试通过，连接延迟: " + connectTime + "ms");
        
        session.disconnect();
        stompClient.stop();
    }
}
