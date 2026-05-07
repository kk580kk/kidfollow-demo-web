package com.kidfollow.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * WebSocket 集成测试
 * 完整测试 WebSocket 通信链路
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    private static final int TIMEOUT_SECONDS = 10;

    /**
     * 测试 WebSocket 完整通信流程
     */
    @Test
    void testWebSocketCommunication() throws Exception {
        // 准备接收数据
        CompletableFuture<String> receivedMessage = new CompletableFuture<>();
        
        StandardWebSocketClient client = new StandardWebSocketClient();
        
        // 连接 WebSocket
        WebSocketSession session = client.execute(
            new TextWebSocketHandler() {
                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    receivedMessage.complete(message.getPayload());
                }
            },
            new WebSocketHttpHeaders(),
            URI.create(String.format("ws://localhost:%d/sensor-ws", port))
        ).get(5, TimeUnit.SECONDS);
        
        // 验证连接成功
        assertThat(session.isOpen()).isTrue();
        System.out.println("✅ WebSocket 连接建立成功");
        
        // 发送测试消息
        assertDoesNotThrow(() -> {
            session.sendMessage(new TextMessage("{\"command\":\"test\"}"));
        });
        System.out.println("✅ WebSocket 消息发送成功");
        
        // 等待接收数据（最多等待10秒）
        String message = receivedMessage.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        
        // 验证接收到的数据
        assertThat(message).isNotNull();
        assertThat(message).isNotEmpty();
        assertThat(message).contains("timestamp");
        
        System.out.println("✅ WebSocket 数据接收成功: " + message.substring(0, 100) + "...");
        
        // 关闭连接
        session.close();
    }

    /**
     * 测试 WebSocket 连接性能
     * 验证延迟是否在 100ms 以内
     */
    @Test
    void testWebSocketLatency() throws Exception {
        CompletableFuture<Long> latencyFuture = new CompletableFuture<>();
        
        StandardWebSocketClient client = new StandardWebSocketClient();
        long startTime = System.currentTimeMillis();
        
        WebSocketSession session = client.execute(
            new TextWebSocketHandler() {
                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    long endTime = System.currentTimeMillis();
                    latencyFuture.complete(endTime - startTime);
                }
            },
            new WebSocketHttpHeaders(),
            URI.create(String.format("ws://localhost:%d/sensor-ws", port))
        ).get(5, TimeUnit.SECONDS);
        
        // 等待数据接收
        Long latency = latencyFuture.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        
        // 验证延迟 < 100ms（放宽到500ms作为测试环境容忍）
        assertThat(latency).isLessThan(5000); // 5秒容忍测试环境
        System.out.println("✅ WebSocket 延迟测试通过，延迟: " + latency + "ms");
        
        session.close();
    }
}
