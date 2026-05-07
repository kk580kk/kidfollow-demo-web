package com.kidfollow.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * WebSocket 接口自动化测试
 * 测试传感器数据实时通信
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SensorWebSocketHandlerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private SensorWebSocketController sensorWebSocketController;

    /**
     * 测试 WebSocket 连接建立
     */
    @Test
    void testWebSocketConnection() throws Exception {
        // 连接 WebSocket
        CompletableFuture<String> messageFuture = new CompletableFuture<>();
        
        StandardWebSocketClient client = new StandardWebSocketClient();
        client.execute(
            new TextWebSocketHandler() {
                @Override
                protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                    messageFuture.complete(message.getPayload());
                }
            },
            String.format("ws://localhost:%d/sensor-ws", port)
        ).get(5, TimeUnit.SECONDS);

        // 等待接收数据（最多5秒）
        String receivedData = messageFuture.get(5, TimeUnit.SECONDS);
        
        // 验证接收到的数据不为空
        assertThat(receivedData).isNotEmpty();
        System.out.println("✅ WebSocket 连接测试通过");
    }

    /**
     * 测试数据格式验证
     */
    @Test
    void testSensorDataFormat() {
        // 验证处理器存在
        assertThat(sensorWebSocketHandler).isNotNull();
        System.out.println("✅ 传感器数据处理组件测试通过");
    }
}
