package com.kidfollow.demo.config;

import com.kidfollow.demo.controller.PathPlanningWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/sensor-ws").setAllowedOriginPatterns("*");
        registry.addEndpoint("/sensor-ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(pathPlanningWebSocketHandler(), "/ws/path-planning")
                .setAllowedOrigins("*");
    }

    @Bean
    public PathPlanningWebSocketHandler pathPlanningWebSocketHandler() {
        return new PathPlanningWebSocketHandler();
    }
}