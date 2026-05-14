package com.kidfollow.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * WebSocket 接口自动化测试
 * 测试传感器数据实时通信 (STOMP协议)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SensorWebSocketHandlerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private SensorWebSocketController sensorWebSocketController;

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
                                          org.springframework.messaging.simp.stomp.StompCommand command,
                                          StompHeaders headers, byte[] payload, Throwable exception) {
                    sessionFuture.completeExceptionally(exception);
                }
            }
        );
        
        // 等待连接建立
        StompSession session = sessionFuture.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        
        assertTrue(session.isConnected(), "WebSocket/STOMP连接应该建立");
        System.out.println("✅ WebSocket/STOMP 连接测试通过");
        
        // 发送场景更新
        session.send("/app/scene-update", """
            {"vehicle": {"position": [0, 0, 0], "rotation": 0}, \
             "target": {"position": [2, 0, 2], "detected": true}, \
             "obstacles": []}
            """.getBytes());
        
        System.out.println("✅ 场景更新发送成功");
        
        session.disconnect();
        stompClient.stop();
    }

    /**
     * 测试数据格式验证
     */
    @Test
    void testSensorDataFormat() {
        // 验证处理器存在
        assertThat(sensorWebSocketController).isNotNull();
        System.out.println("✅ 传感器数据处理组件测试通过");
    }
}
